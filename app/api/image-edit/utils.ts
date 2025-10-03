import path from 'path';
import { BLOG_CONFIG } from '@/app/common/globals';
import { TaskInfo, TaskResponse } from './types';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import sharp from 'sharp';
import imageStorage from '@/app/lib/ImageStorage';

export const INDEX_FILE = path.join(BLOG_CONFIG.ROOT_DIR, "image-edit", 'index.json');

// 确保索引目录存在
const indexDir = path.dirname(INDEX_FILE);
if(!existsSync(indexDir)) {
  mkdirSync(indexDir, { recursive: true });
}
// 确保索引文件存在
if(!existsSync(INDEX_FILE)) {
  writeFileSync(INDEX_FILE, JSON.stringify({ tasks: [] }));
}

// 从Buffer创建缩略图并保存到imageStorage
async function createThumbnailFromBuffer(buffer: Buffer, fileName: string, edge_size?: number): Promise<string> {
  if(!buffer) {
    throw new Error("buffer is required");
  }
  edge_size = edge_size || 180;
  
  const thumbnailBuffer = await sharp(buffer)
    .resize(edge_size, edge_size)
    .jpeg({ quality: 80 })
    .toBuffer();
  
  // Save thumbnail using imageStorage with the same fileName
  await imageStorage.saveThumbnail(fileName, thumbnailBuffer);
  return fileName; // Return the same fileName as the ID
}

/**  
 * basic: yyyymmddhhmmssmmm-rand6
 * ext: png | thumb.png | etc.
 * result: yyyymmddhhmmssmmm-rand6.ext
 */
export function generateId(ext?: string) : string {
  // 获取当前时间
  const now = new Date();
  
  // 格式化日期时间部分：yyyymmddhhmmssmmm
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
  
  // 生成6位随机数
  const randomPart = Math.random().toString().slice(2, 8);
  if(ext && !ext.startsWith('.')) {
    ext = '.' + ext;
  }
  return `${timestamp}-${randomPart}${ext ?? ''}`;
}

export async function get_image_base64(image_id: string): Promise<string> {
  const assetData = await imageStorage.getImage(image_id);
  if (!assetData) {
    throw new Error(`Image ${image_id} not found`);
  }
  return Buffer.from(assetData.buffer).toString('base64');
}

/**
 * Tasks management
 */
const _processing_tasks = new Map<string, TaskInfo>();

/**
 * Helper function to create serializable task data
 * Excludes non-serializable properties like controller and timeout
 */
function createSerializableTask(task: TaskInfo) {
  return {
    id: task.id,
    status: task.status,
    original_image: task.original_image,
    result_image: task.result_image,
    prompt: task.prompt,
    message: task.message,
    created_at: task.created_at,
    updated_at: task.updated_at,
    // Exclude controller and timeout as they contain circular references
  };
}

/**
 * Helper function to save all tasks to the index file
 */
function saveTasksToFile() {
  const serializableTasks = Array.from(_processing_tasks.values()).map(createSerializableTask);
  writeFileSync(INDEX_FILE, JSON.stringify({ tasks: serializableTasks }));
}

function init_tasks() {
  const indexFile = readFileSync(INDEX_FILE, 'utf-8');
  const tasks = JSON.parse(indexFile).tasks;
  tasks.forEach((task: any) => {
    // Ensure controller and timeout are properly initialized
    const taskInfo: TaskInfo = {
      ...task,
      controller: null,
      timeout: null,
    };
    _processing_tasks.set(task.id, taskInfo);
  });
  console.log(`🐍 Loaded ${tasks.length} tasks`);
}
init_tasks();

function get_task(task_id: string) : TaskInfo | undefined {
  return _processing_tasks.get(task_id);
}

/**
 * Get all tasks
 * @returns All tasks
 */
function get_tasks() : Map<string, TaskInfo> {
  return _processing_tasks;
}

function view_task(task_id: string) : TaskResponse | undefined {
  const task_info = get_task(task_id);
  if(!task_info) {
    throw new Error("Task not found");
  }
  return {
    id: task_info.id,
    status: task_info.status,
    original_image: task_info.original_image,
    result_image: task_info.result_image,
    prompt: task_info.prompt,
    created_at: task_info.created_at,
    updated_at: task_info.updated_at,
  };
}

/**
 * Get all tasks view
 * @returns All tasks
 */
function view_tasks() : TaskResponse[] {
  return Array.from(_processing_tasks.values()).map(task => view_task(task.id)).filter(task => task !== undefined);
}

/**
 * 更新任务状态
 * @param task_info - The task information to update
 */
function update_task(task_info: Partial<TaskInfo>) {
  const task_id = task_info.id;
  if(!task_id) {
    throw new Error("Task ID is required");
  }
  const task = _processing_tasks.get(task_id);
  if(task) {
    Object.assign(task, task_info);
    task.updated_at = Date.now();
    _processing_tasks.set(task_id, task);
  } else {
    // new task
    _processing_tasks.set(task_id, task_info as TaskInfo);
  }
  
  saveTasksToFile();
}

async function start_task(task_id: string) {
  const task_info = get_task(task_id);
  if(!task_info) {
    throw new Error("Task not found");
  }
  const { original_image, prompt } = task_info;
  const controller = new AbortController();  // 默认600s超时，后续再支持由用户发起取消请求
  task_info.timeout = setTimeout(() => {
    controller.abort();
  }, 600000);
  task_info.controller = controller;
  task_info.status = "processing";

  const image_base64 = await get_image_base64(original_image);
  console.log(`🐍 Starting task ${task_id} with image base64 length ${image_base64.length}`);
  update_task(task_info);
  const result = await edit_image_with_gemini(image_base64, prompt, controller.signal);

  // save the result image to the storage
  const result_image_base64 = result.candidates[0].content.parts[1].inlineData?.data;
  if(!result_image_base64) {
    throw new Error("Result image base64 is not found");
  }
  const result_image_id = generateId("png");
  let result_thumbnail_id = result_image_id; // Same ID for thumbnail
  try {
    // 移除Base64前缀（如果有）
    const base64Data = result_image_base64.replace(/^data:image\/\w+;base64,/, '');
    
    // 将Base64字符串转换为Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save result image using imageStorage
    await imageStorage.saveImage(result_image_id, buffer);
    result_thumbnail_id = await createThumbnailFromBuffer(buffer, result_image_id);
    
    console.log('文件保存成功:', result_image_id);
  } catch (error: any) {
    console.error('保存文件失败:', error);
    task_info.message = error.message;
    stop_task(task_id);
    return false;
  }

  if(task_info.timeout) {
    clearTimeout(task_info.timeout);
    task_info.timeout = null;
  }
  task_info.controller = null;
  task_info.status = "completed";
  update_task(task_info);
  console.log(`🐍 Task ${task_id} completed`);
  return result;
}

function stop_task(task_id: string) {
  const task_info = get_task(task_id);
  if(!task_info) {
    throw new Error("Task not found");
  }
  if(task_info.controller) {
    task_info.controller.abort();
    task_info.controller = null;
  }
  if(task_info.timeout) {
    clearTimeout(task_info.timeout);
    task_info.timeout = null;
  }
  task_info.status = "failed";
  update_task(task_info);
}

function delete_task(task_id: string) {
  stop_task(task_id);
  _processing_tasks.delete(task_id);
  
  saveTasksToFile();
}

export const task_manager = {
  get_task,
  get_tasks,
  view_task,
  view_tasks,
  update_task,
  start_task,
  stop_task,
  delete_task,
}


// TASK EXECUTION
// 服务配置
const BASE_URL = process.env.GEMINI_API_URL;
const ENDPOINT = process.env.GEMINI_API_ENDPOINT;
const API_KEY = process.env.GEMINI_API_KEY;

type GeminiResponse = {
  candidates: {
    content: {
      parts: {
        text?: string;
        inlineData?: Record<string, any>;
      }[];
    };
  }[];
}
/**
 * Edit image with Gemini API
 * @param image_base64 - The base64 encoded image
 * @param edit_prompt - The prompt to edit the image
 * @param abort_signal - The abort signal
 * @returns The response from the Gemini API
 */
async function edit_image_with_gemini(image_base64: string, edit_prompt: string, abort_signal: AbortSignal) : Promise<GeminiResponse> {
  if (!BASE_URL || !ENDPOINT || !API_KEY) {
    throw new Error("GEMINI_API_URL, GEMINI_API_ENDPOINT, GEMINI_API_KEY are not set");
  }
  if (!image_base64 || !edit_prompt || !abort_signal) {
    throw new Error("image_base64, edit_prompt, abort_signal are required");
  }
  // const payload = {
  //   contents: [
  //     {
  //       parts: [
  //         { text: edit_prompt },
  //         { inlineData: { mimeType: "image/png", data: image_base64 } },
  //       ],
  //     },
  //   ],
  //   generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  // };
  // const headers = {
  //   "Content-Type": "application/json",
  //   Authorization: "Bearer " + API_KEY,
  // };
  // const response = await fetch(BASE_URL + ENDPOINT, {
  //   method: "POST",
  //   headers: headers,
  //   body: JSON.stringify(payload),
  //   signal: abort_signal,
  // });

  // mock response
  const response: GeminiResponse = {
    "candidates": [
      {
        "content": {
          "parts": [
            { "text": "The image shows a man wearing a hat" },
            { "inlineData": { 
              "mimeType": "image/png", 
              "data": "base64_encoded_image" 
            }}
          ]
        }
      }
    ]
  }
  return response;
}




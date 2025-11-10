import { get, post, put, del, baseFetch } from './utils';

// ===== 类型定义 =====

/**
 * 图片编辑任务状态
 */
export type ImageEditTaskStatus = 'processing' | 'completed' | 'failed';

/**
 * 图片编辑任务信息
 */
export interface ImageEditTask {
  id: string;
  status: ImageEditTaskStatus;
  original_image: string;
  result_image?: string;
  prompt: string;
  message?: string;
  created_at: number;
  updated_at: number;
}

/**
 * 开始图片编辑任务的请求参数
 */
export interface StartImageEditRequest {
  orig_img: string;
  prompt: string;
}

/**
 * 开始图片编辑任务的响应
 */
export interface StartImageEditResponse {
  task_id: string;
}

/**
 * 图片上传响应
 */
export interface ImageUploadResponse {
  success: boolean;
  id: string;
  originalName: string;
}

/**
 * 图片删除响应
 */
export interface ImageDeleteResponse {
  success: boolean;
  message: string;
}

/**
 * 任务停止/删除响应
 */
export interface TaskActionResponse {
  message: string;
}

// ===== 图片编辑服务 =====

export const imageEditService = {
  getAllTasks: async (): Promise<ImageEditTask[]> => {
    return get<ImageEditTask[]>('/api/image-edit');
  },

  /**
   * 获取图片编辑任务状态
   * @param taskId 任务ID
   * @returns 任务信息
   */
  getTaskStatus: async (taskId: string): Promise<ImageEditTask> => {
    return get<ImageEditTask>('/api/image-edit', {
      params: { task_id: taskId }
    });
  },

  /**
   * 开始新的图片编辑任务
   * @param request 编辑请求参数
   * @returns 任务ID
   */
  startEditTask: async (request: StartImageEditRequest): Promise<StartImageEditResponse> => {
    return post<StartImageEditResponse>('/api/image-edit', request);
  },

  /**
   * 停止正在运行的任务（保留在存储中，状态设为failed）
   * @param taskId 任务ID
   * @returns 操作结果
   */
  stopTask: async (taskId: string): Promise<TaskActionResponse> => {
    return put<TaskActionResponse>('/api/image-edit', undefined, {
      params: { task_id: taskId }
    });
  },

  /**
   * 删除任务（停止任务并从存储中完全删除）
   * @param taskId 任务ID
   * @returns 操作结果
   */
  deleteTask: async (taskId: string): Promise<TaskActionResponse> => {
    return del<TaskActionResponse>('/api/image-edit', {
      params: { task_id: taskId }
    });
  },

  /**
   * 重试失败的任务（重置状态并重新开始）
   * @param taskId 任务ID
   * @param newPrompt 可选的新提示词，如果提供则更新任务的提示词
   * @returns 操作结果
   */
  retryTask: async (taskId: string, newPrompt?: string): Promise<TaskActionResponse> => {
    return baseFetch<TaskActionResponse>('/api/image-edit', {
      method: 'PATCH',
      params: { task_id: taskId },
      body: newPrompt ? { prompt: newPrompt } : undefined
    });
  },

  /**
   * 轮询任务状态直到完成或失败
   * @param taskId 任务ID
   * @param pollInterval 轮询间隔（毫秒），默认2000ms
   * @param maxAttempts 最大轮询次数，默认150次（5分钟）
   * @returns 完成的任务信息
   */
  pollTaskStatus: async (
    taskId: string, 
    pollInterval: number = 2000, 
    maxAttempts: number = 150
  ): Promise<ImageEditTask> => {
    let attempts = 0;
    
    const poll = async (): Promise<ImageEditTask> => {
      attempts++;
      const task = await imageEditService.getTaskStatus(taskId);
      
      if (task.status === 'completed' || task.status === 'failed') {
        return task;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error(`Task polling timeout after ${maxAttempts} attempts`);
      }
      
      // 等待指定时间后继续轮询
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      return poll();
    };
    
    return poll();
  }
};

// ===== 图片资产服务 =====

export const imageAssetService = {
  /**
   * 上传图片资产
   * @param file 图片文件
   * @param generateThumbnail 是否生成缩略图，默认为false
   * @returns 上传结果
   */
  uploadImage: async (file: File, generateThumbnail: boolean = false): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    return post<ImageUploadResponse>('/api/asset/image', formData, {
      params: { generateThumbnail: generateThumbnail.toString() }
    });
  },

  /**
   * 获取图片URL
   * @param id 图片ID
   * @returns 图片URL
   */
  getImageUrl: (id: string): string => {
    return `/api/asset/image/${id}`;
  },

  /**
   * 获取缩略图URL
   * @param id 图片ID（与原图ID相同）
   * @returns 缩略图URL
   */
  getThumbnailUrl: (id: string): string => {
    return `/api/asset/thumbnail/${id}`;
  },

  /**
   * 删除图片资产及其缩略图
   * @param id 图片ID
   * @returns 删除结果
   */
  deleteImage: async (id: string): Promise<ImageDeleteResponse> => {
    return del<ImageDeleteResponse>(`/api/asset/image/${id}`);
  },

  /**
   * 下载图片为Blob对象
   * @param id 图片ID
   * @returns 图片Blob
   */
  downloadImage: async (id: string): Promise<Blob> => {
    const response = await fetch(`/api/asset/image/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    
    return response.blob();
  },

  /**
   * 下载缩略图为Blob对象
   * @param id 图片ID
   * @returns 缩略图Blob
   */
  downloadThumbnail: async (id: string): Promise<Blob> => {
    const response = await fetch(`/api/asset/thumbnail/${id}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download thumbnail: ${response.statusText}`);
    }
    
    return response.blob();
  }
};

// ===== 综合图片服务 =====

/**
 * 综合图片服务，包含编辑和资产管理功能
 */
export const imageService = {
  // 图片编辑功能
  edit: imageEditService,
  
  // 图片资产管理功能
  asset: imageAssetService,

  /**
   * 完整的图片编辑工作流：上传图片 -> 开始编辑 -> 等待完成
   * @param file 原始图片文件
   * @param prompt 编辑指令
   * @param generateThumbnail 是否为原图生成缩略图
   * @param onProgress 进度回调函数
   * @returns 编辑完成的任务信息
   */
  editImageWorkflow: async (
    file: File,
    prompt: string,
    generateThumbnail: boolean = true,
    onProgress?: (status: string, task?: ImageEditTask) => void
  ): Promise<ImageEditTask> => {
    try {
      // 1. 上传原始图片
      onProgress?.('Uploading image...');
      const uploadResult = await imageAssetService.uploadImage(file, generateThumbnail);
      
      // 2. 开始编辑任务
      onProgress?.('Starting edit task...');
      const editResult = await imageEditService.startEditTask({
        orig_img: uploadResult.id,
        prompt
      });
      
      // 3. 轮询任务状态
      onProgress?.('Processing image...');
      const completedTask = await imageEditService.pollTaskStatus(
        editResult.task_id,
        2000, // 2秒轮询间隔
        150,  // 最多5分钟
      );
      
      onProgress?.('Completed!', completedTask);
      return completedTask;
      
    } catch (error) {
      onProgress?.(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
};

// 默认导出
export default imageService;

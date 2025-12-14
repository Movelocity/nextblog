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
    return get<ImageEditTask[]>('/image-edit');
  },

  /**
   * 获取图片编辑任务状态
   * @param taskId 任务ID
   * @returns 任务信息
   */
  getTaskStatus: async (taskId: string): Promise<ImageEditTask> => {
    return get<ImageEditTask>(`/image-edit?task_id=${taskId}`);
  },

  /**
   * 开始新的图片编辑任务
   * @param request 编辑请求参数
   * @returns 任务ID
   */
  startEditTask: async (request: StartImageEditRequest): Promise<StartImageEditResponse> => {
    const payload = {
      original_image: request.orig_img,
      prompt: request.prompt
    };
    const response = await post<ImageEditTask>('/image-edit', payload);
    return { task_id: response.id };
  },

  /**
   * 停止正在运行的任务（保留在存储中，状态设为failed）
   * @param taskId 任务ID
   * @returns 操作结果
   */
  stopTask: async (taskId: string): Promise<TaskActionResponse> => {
    return put<TaskActionResponse>(`/image-edit?task_id=${taskId}`, {});
  },

  /**
   * 删除任务（停止任务并从存储中完全删除）
   * @param taskId 任务ID
   * @returns 操作结果
   */
  deleteTask: async (taskId: string): Promise<TaskActionResponse> => {
    return del<TaskActionResponse>(`/image-edit?task_id=${taskId}`);
  },

  /**
   * 重试失败的任务（重置状态并重新开始）
   * @param taskId 任务ID
   * @param newPrompt 可选的新提示词，如果提供则更新任务的提示词
   * @returns 操作结果
   */
  retryTask: async (taskId: string, newPrompt?: string): Promise<TaskActionResponse> => {
    const payload = newPrompt ? { prompt: newPrompt } : {};
    return baseFetch<TaskActionResponse>(`/image-edit?task_id=${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
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

/**
 * 缩略图尺寸选项
 */
export type ThumbnailSize = 'small' | 'medium' | 'large' | number;

/**
 * 缩略图尺寸映射
 */
const THUMBNAIL_SIZE_MAP: Record<Exclude<ThumbnailSize, number>, number> = {
  small: 120,
  medium: 240,
  large: 480,
};

/**
 * 缩略图选项
 */
export interface ThumbnailOptions {
  /** 缩略图尺寸（预设或自定义像素值） */
  size?: ThumbnailSize;
  /** 自定义宽度 */
  width?: number;
  /** 自定义高度 */
  height?: number;
}

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
    
    // Go 后端使用 /images/upload
    interface GoImageUploadResponse {
      filename: string;
      url: string;
      size: number;
    }
    
    const response = await post<GoImageUploadResponse>('/images/upload', formData);
    
    // 适配返回格式
    return {
      success: true,
      id: response.filename,
      originalName: file.name
    };
  },

  /**
   * 获取图片URL
   * @param id 图片ID（filename）
   * @returns 图片URL
   */
  getImageUrl: (id: string): string => {
    return `api/images/${id}`;
  },

  /**
   * 获取缩略图URL
   * @param id 图片ID（与原图ID相同）
   * @param options 缩略图选项
   * @returns 缩略图URL
   */
  getThumbnailUrl: (id: string, options?: ThumbnailOptions): string => {
    const baseUrl = `/api/images/${id}`;
    const params = new URLSearchParams({ thumbnail: 'true' });

    if (options?.width && options?.height) {
      // 自定义宽高
      params.set('width', options.width.toString());
      params.set('height', options.height.toString());
    } else if (options?.size !== undefined) {
      // 使用预设尺寸或自定义尺寸
      const size = typeof options.size === 'number' 
        ? options.size 
        : THUMBNAIL_SIZE_MAP[options.size];
      params.set('size', size.toString());
    }
    // 如果没有指定任何尺寸，使用默认 180x180

    return `${baseUrl}?${params.toString()}`;
  },

  /**
   * 智能转换图片URL为缩略图URL
   * 支持图片URL格式：
   * - /api/assets/{id}
   * - api/assets/{id}
   * - 完整URL（http://...）
   * 
   * @param imageUrl 原始图片URL
   * @param options 缩略图选项
   * @returns 缩略图URL
   * 
   * @example
   * ```ts
   * // 使用默认尺寸 (180x180)
   * toThumbnail('/api/assets/abc123')
   * // => '/api/images/abc123?thumbnail=true'
   * 
   * // 使用预设小尺寸 (120x120)
   * toThumbnail('/api/assets/abc123', { size: 'small' })
   * // => '/api/images/abc123?thumbnail=true&size=120'
   * 
   * // 自定义尺寸
   * toThumbnail('/api/assets/abc123', { size: 300 })
   * // => '/api/images/abc123?thumbnail=true&size=300'
   * 
   * // 自定义宽高
   * toThumbnail('/api/assets/abc123', { width: 400, height: 300 })
   * // => '/api/images/abc123?thumbnail=true&width=400&height=300'
   * ```
   */
  toThumbnail: (imageUrl: string, options?: ThumbnailOptions): string => {
    // 如果已经是缩略图URL，直接返回
    if (imageUrl.includes('thumbnail=true')) {
      return imageUrl;
    }

    try {
      // 尝试解析URL
      const url = new URL(imageUrl, window.location.origin);
      const pathname = url.pathname;
      
      // 提取文件ID
      let fileId: string | null = null;
      
      // 只匹配 /api/assets/{id}
      const assetMatch = pathname.match(/\/api\/assets\/([^\/\?]+)/);
      if (assetMatch) {
        fileId = assetMatch[1];
      }

      if (!fileId) {
        // 如果无法解析，返回原始URL
        console.warn('[toThumbnail] Unable to parse image URL:', imageUrl);
        return imageUrl;
      }

      // 构建缩略图URL
      const thumbnailUrl = imageAssetService.getThumbnailUrl(fileId, options);
      
      // 如果原始URL是完整URL，保持完整URL格式
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return new URL(thumbnailUrl, window.location.origin).href;
      }
      
      return thumbnailUrl;
    } catch (error) {
      // URL解析失败，返回原始URL
      console.warn('[toThumbnail] Failed to parse URL:', imageUrl, error);
      return imageUrl;
    }
  },

  /**
   * 删除图片资产及其缩略图
   * @param id 图片ID（filename）
   * @returns 删除结果
   */
  deleteImage: async (id: string): Promise<ImageDeleteResponse> => {
    // Go 后端使用 DELETE /images/:filename
    const response = await del<{ message: string }>(`/images/${id}`);
    return {
      success: true,
      message: response.message
    };
  },

  /**
   * 下载图片为Blob对象
   * @param id 图片ID（filename）
   * @returns 图片Blob
   */
  downloadImage: async (id: string): Promise<Blob> => {
    const url = imageAssetService.getImageUrl(id);
    const response = await fetch(url);
    
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
    const url = imageAssetService.getThumbnailUrl(id);
    const response = await fetch(url);
    
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

import { baseFetch, get, post, put, del } from './utils';

// 图片编辑相关类型定义
export interface ImageData {
  id: string;
  thumb_id: string;
}

export interface TaskResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  original_image: ImageData;
  result_image?: ImageData;
  prompt: string;
  message?: string;
  created_at: number;
  updated_at: number;
}

export interface CreateTaskInput {
  orig_img: string;
  orig_thumb: string;
  prompt: string;
}

export interface UploadFileResponse {
  id: string;
  originalName: string;
  thumbnail?: {
    id: string;
    path: string;
  };
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 文件管理相关服务 - 使用新的独立图片存储结构
export const fileService = {
  /**
   * Downloads a file by ID
   * @param id File ID
   * @param thumbnail Whether to get thumbnail version
   * @returns Promise with the file blob
   */
  downloadFile: async (id: string, thumbnail: boolean = false): Promise<Blob> => {
    if (thumbnail) {
      const response = await fetch(`/api/asset/thumbnail/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download thumbnail: ${response.statusText}`);
      }
      
      return response.blob();
    } else {
      const params = new URLSearchParams({
        fileName: id
      });
      
      const response = await fetch(`/api/asset/image?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      return response.blob();
    }
  },

  /**
   * Uploads a file with automatic thumbnail generation
   * @param file File to upload
   * @param generateThumbnail Whether to generate thumbnail
   * @returns Promise with upload response containing file ID and optional thumbnail
   */
  uploadFile: async (file: File, generateThumbnail: boolean = true): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({
      generateThumbnail: generateThumbnail.toString()
    });

    return post<UploadFileResponse>(`/api/asset/image?${params}`, formData);
  },

  /**
   * Deletes a file by ID (including its thumbnail)
   * @param id File ID to delete
   * @returns Promise with success status
   */
  deleteFile: async (id: string): Promise<{ success: boolean }> => {
    return del<{ success: boolean }>('/api/asset/image', {
      params: { 
        fileName: id 
      }
    });
  },

  /**
   * Gets file URL for display purposes
   * @param id File ID
   * @param thumbnail Whether to get thumbnail version
   * @returns File URL
   */
  getFileUrl: (id: string, thumbnail: boolean = false): string => {
    if (thumbnail) {
      return `/api/asset/thumbnail/${id}`;
    } else {
      const params = new URLSearchParams({
        fileName: id
      });
      
      return `/api/asset/image?${params}`;
    }
  },
};

// 任务管理相关服务
export const taskService = {
  /**
   * Queries task status and details
   * @param taskId Task ID
   * @returns Promise with task response
   */
  getTask: async (taskId: string): Promise<TaskResponse> => {
    return get<TaskResponse>('/api/image-edit', {
      params: { task_id: taskId }
    });
  },

  /**
   * Creates a new image editing task
   * @param input Task creation input
   * @returns Promise with task ID
   */
  createTask: async (input: CreateTaskInput): Promise<{ task_id: string }> => {
    return post<{ task_id: string }>('/api/image-edit', input);
  },

  /**
   * Stops a running task
   * @param taskId Task ID to stop
   * @returns Promise with success message
   */
  stopTask: async (taskId: string): Promise<{ message: string }> => {
    return put<{ message: string }>('/api/image-edit', undefined, {
      params: { task_id: taskId }
    });
  },

  /**
   * Deletes a task (stops it first if running)
   * @param taskId Task ID to delete
   * @returns Promise with success message
   */
  deleteTask: async (taskId: string): Promise<{ message: string }> => {
    return del<{ message: string }>('/api/image-edit', {
      params: { task_id: taskId }
    });
  },

  /**
   * Polls task status until completion or failure
   * @param taskId Task ID to poll
   * @param onProgress Optional callback for progress updates
   * @param pollInterval Polling interval in milliseconds (default: 2000)
   * @param maxAttempts Maximum polling attempts (default: 150, ~5 minutes)
   * @returns Promise with final task response
   */
  pollTaskStatus: async (
    taskId: string,
    onProgress?: (task: TaskResponse) => void,
    pollInterval: number = 2000,
    maxAttempts: number = 150
  ): Promise<TaskResponse> => {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const task = await taskService.getTask(taskId);
        
        if (onProgress) {
          onProgress(task);
        }
        
        if (task.status === 'completed' || task.status === 'failed') {
          return task;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;
      } catch (error) {
        console.error('Error polling task status:', error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error('Task polling timeout: Maximum attempts reached');
  },
};

// 综合的图片编辑服务
export const imageEditService = {
  /**
   * Complete workflow: upload image, create task, and poll for completion
   * @param file Original image file
   * @param prompt Editing prompt
   * @param onProgress Optional progress callback
   * @returns Promise with completed task response
   */
  editImage: async (
    file: File,
    prompt: string,
    onProgress?: (status: 'uploading' | 'creating' | 'processing', data?: any) => void
  ): Promise<TaskResponse> => {
    try {
      // Step 1: Upload original image
      if (onProgress) onProgress('uploading');
      const uploadResponse = await fileService.uploadFile(file);
      
      // Step 2: Create editing task
      if (onProgress) onProgress('creating');
      const taskResponse = await taskService.createTask({
        orig_img: uploadResponse.id,
        orig_thumb: uploadResponse.thumbnail?.id || uploadResponse.id, // Use thumbnail ID if available
        prompt,
      });
      
      // Step 3: Poll for completion
      if (onProgress) onProgress('processing');
      const finalTask = await taskService.pollTaskStatus(
        taskResponse.task_id,
        (task) => {
          if (onProgress) {
            onProgress('processing', task);
          }
        }
      );
      
      return finalTask;
    } catch (error) {
      console.error('Image editing workflow failed:', error);
      throw error;
    }
  },

  /**
   * Downloads the result image from a completed task
   * @param task Completed task response
   * @returns Promise with result image blob
   */
  downloadResult: async (task: TaskResponse): Promise<Blob> => {
    if (!task.result_image) {
      throw new Error('Task has no result image');
    }
    
    return fileService.downloadFile(task.result_image.id);
  },

  /**
   * Downloads the thumbnail of result image
   * @param task Completed task response
   * @returns Promise with thumbnail blob
   */
  downloadResultThumbnail: async (task: TaskResponse): Promise<Blob> => {
    if (!task.result_image) {
      throw new Error('Task has no result image');
    }
    
    return fileService.downloadFile(task.result_image.thumb_id);
  },

  /**
   * Cleans up task and associated files
   * @param taskId Task ID to clean up
   * @returns Promise with cleanup status
   */
  cleanup: async (taskId: string): Promise<void> => {
    try {
      // Get task details first to get file IDs
      const task = await taskService.getTask(taskId);
      
      // Delete task (this will also stop it if running)
      await taskService.deleteTask(taskId);
      
      // Clean up files (optional, as they might be reused)
      // Note: Be careful about deleting files as they might be referenced elsewhere
      // await fileService.deleteFile(task.original_image.id);
      // if (task.result_image) {
      //   await fileService.deleteFile(task.result_image.id);
      //   await fileService.deleteFile(task.result_image.thumb_id);
      // }
    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  },
};

// Export all services
export default {
  file: fileService,
  task: taskService,
  imageEdit: imageEditService,
};

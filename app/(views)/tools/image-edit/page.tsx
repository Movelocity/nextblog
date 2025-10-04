'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  RiUploadLine, 
  RiImageLine, 
  RiRefreshLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import cn from 'classnames';
import imageService, { ImageEditTask } from '@/app/services/image';

type UploadImage = {
  id?: string;
  url?: string;
  file?: File
  size?: {
    w: number;
    h: number;
  }
}

/**
 * Image Edit Page
 * User-friendly interface for uploading and editing images with AI
 */
export default function ImageEditPage() {
  // Upload states
  const [uploadImage, setUploadImage] = useState<UploadImage>({});
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Task list states
  const [tasks, setTasks] = useState<ImageEditTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;
  
  // Preview modal states
  const [previewImage, setPreviewImage] = useState<UploadImage>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  /**
   * Load tasks on mount
   */
  useEffect(() => {
    handleRefreshTasks();

    window.dispatchEvent(new CustomEvent("update-title", { detail: { title: "AI 图片编辑" } }));
  }, []);

  /**
   * Resizes image if needed and returns a new File object
   */
  const resizeImageIfNeeded = (file: File): Promise<{ file: File; size: { w: number; h: number } }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { naturalWidth: width, naturalHeight: height } = img;
        const maxSize = 1024;
        
        // Check if resize is needed
        if (width <= maxSize && height <= maxSize) {
          resolve({ file, size: { w: width, h: height } });
          return;
        }
        
        // Calculate new dimensions
        const ratio = Math.min(maxSize / width, maxSize / height);
        const newWidth = Math.round(width * ratio);
        const newHeight = Math.round(height * ratio);
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ file, size: { w: width, h: height } });
          return;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Convert to blob and create new file
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve({ file: resizedFile, size: { w: newWidth, h: newHeight } });
          } else {
            resolve({ file, size: { w: width, h: height } });
          }
        }, file.type, 0.9);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  /**
   * Handles file selection
   */
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    
    try {
      // Resize image if needed
      const { file: processedFile, size } = await resizeImageIfNeeded(file);
      
      // Create preview URL
      const url = URL.createObjectURL(processedFile);
      setUploadImage({ url, file: processedFile, size });
      
      // Show resize notification if image was resized
      if (processedFile !== file) {
        console.log(`图片已自动缩放: ${size.w}x${size.h}`);
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      alert('处理图片失败，请重试');
    }
  };

  /**
   * Handles file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handles paste event
   */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileSelect(file);
          }
          break;
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  /**
   * Handles drag and drop
   */
  useEffect(() => {
    const area = uploadAreaRef.current;
    if (!area) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const file = e.dataTransfer?.files[0];
      if (file) {
        handleFileSelect(file);
      }
    };

    area.addEventListener('dragover', handleDragOver);
    area.addEventListener('drop', handleDrop);

    return () => {
      area.removeEventListener('dragover', handleDragOver);
      area.removeEventListener('drop', handleDrop);
    };
  }, []);

  /**
   * Refreshes task list
   */
  const handleRefreshTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const allTasks = await imageService.edit.getAllTasks();
      // Sort by updated_at descending (newest first)
      allTasks.sort((a, b) => b.updated_at - a.updated_at);
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      alert('加载任务列表失败');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  /**
   * Handles submit (upload and start edit)
   */
  const handleSubmit = async () => {
    // if (!selectedFile) {
    //   alert('请先选择图片');
    //   return;
    // }
    
    if (!prompt.trim()) {
      alert('请输入编辑提示词');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageId = uploadImage.id;
      // Upload image with thumbnail
      if (!imageId) {
        if (!uploadImage.file) {
          alert('请先选择图片');
          return;
        }
        const uploadResult = await imageService.asset.uploadImage(uploadImage.file, true);
        imageId = uploadResult.id;
      }

      if (!imageId) {
        alert('图片上传失败');
        return;
      }
      
      // Start edit task
      await imageService.edit.startEditTask({
        orig_img: imageId,
        prompt: prompt.trim()
      });
      
      // Clear form
      // setSelectedFile(null);
      // setPreviewUrl('');
      setUploadImage({});
      setPrompt('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh task list
      await handleRefreshTasks();
      
    } catch (error) {
      console.error('Failed to submit task:', error);
      alert('提交任务失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Opens preview modal
   */
  const handlePreviewImage = (imageId: string, title: string) => {
    // setPreviewImage(imageService.asset.getImageUrl(imageId));
    setPreviewImage({ id: imageId, url: imageService.asset.getImageUrl(imageId) });
    // setPreviewTitle(title);
  };

  /**
   * Closes preview modal
   */
  const handleClosePreview = () => {
    setPreviewImage({});
    // setPreviewTitle('');
  };

  /**
   * Pagination logic
   */
  const totalPages = Math.ceil(tasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const currentTasks = tasks.slice(startIndex, startIndex + tasksPerPage);

  const getPaginationItems = () => {
    const items: (number | 'ellipsis')[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Always show first page
      items.push(1);
      
      if (currentPage > 3) {
        items.push('ellipsis');
      }
      
      // Show current page and adjacent pages
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!items.includes(i)) {
          items.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        items.push('ellipsis');
      }
      
      // Always show last page
      if (!items.includes(totalPages)) {
        items.push(totalPages);
      }
    }
    
    return items;
  };

  /**
   * Formats timestamp
   */
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto p-4">

        {/* Upload and Prompt Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              图片上传
            </label>
            <div
              ref={uploadAreaRef}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative h-64 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg",
                "hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer",
                "bg-white dark:bg-zinc-900 overflow-hidden"
              )}
            >
              {uploadImage.url ? (
                <img 
                  src={uploadImage.url}
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <RiUploadLine className="w-12 h-12 mb-2" />
                  <p className="text-sm">点击上传或粘贴图片</p>
                  <p className="text-xs mt-1">支持拖拽上传</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              {uploadImage.size && (
                <div className="text-xs text-gray-500 dark:text-gray-400 absolute bottom-0 right-2">
                  {uploadImage.size.w}x{uploadImage.size.h}
                </div>
              )}
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              编辑提示词
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的编辑效果，例如：将背景改为蓝天白云，添加一只猫..."
              className={cn(
                "flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg",
                "bg-white dark:bg-zinc-900 text-gray-900 dark:text-white resize-none",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )}
              rows={8}
            />
            
            {/* Action Buttons */}
            <div className="flex mt-2">
              <button
                onClick={handleSubmit}
                disabled={!uploadImage.url || !prompt.trim() || isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                         text-white rounded-lg transition-colors font-medium"
              >
                {isSubmitting ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              任务列表
            </h2>
            <button
              onClick={handleRefreshTasks}
              disabled={isLoadingTasks}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-lg
                        text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800
                        transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RiRefreshLine className={cn("w-4 h-4", isLoadingTasks && "animate-spin")} />
              刷新
            </button>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {currentTasks.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                暂无任务
              </div>
            ) : (
              currentTasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  <div className="flex gap-4">
                    {/* Original Image Thumbnail */}
                    <div className="flex-shrink-0 relative w-24 h-24">
                      <img
                        src={imageService.asset.getThumbnailUrl(task.original_image)}
                        alt="Original"
                        onClick={() => handlePreviewImage(task.original_image, '原图')}
                        className="w-full h-full object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                      />
                      <div className="text-xs text-gray-400 absolute top-0 left-0 bg-black bg-opacity-50 rounded-br-lg rounded-tl-lg px-1 py-0.5">原图</div>
                    </div>

                    {/* Result Image Thumbnail */}
                    <div className="flex-shrink-0 relative w-24 h-24">
                      {task.result_image ? (
                        <img
                          src={imageService.asset.getThumbnailUrl(task.result_image)}
                          alt="Result"
                          onClick={() => handlePreviewImage(task.result_image!, '编辑结果')}
                          className="w-full h-full object-cover rounded border border-gray-200 dark:border-gray-700 
                                   cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="w-full h-full rounded border border-gray-200 dark:border-gray-700 
                                     flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
                          <RiImageLine className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div className="text-xs text-gray-200 absolute top-0 left-0 bg-black bg-opacity-50 rounded-br-lg rounded-tl-lg px-1 py-0.5">结果</div>
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                            {task.prompt}
                          </p>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium whitespace-nowrap",
                          task.status === 'completed' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          task.status === 'processing' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                          task.status === 'failed' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        )}>
                          {task.status === 'completed' && '已完成'}
                          {task.status === 'processing' && '处理中'}
                          {task.status === 'failed' && '失败'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>任务ID: {task.id}</span>
                        <span>更新: {formatTime(task.updated_at)}</span>
                      </div>

                      {task.message && (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                          {task.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 
                         disabled:cursor-not-allowed transition-colors"
              >
                <RiArrowLeftSLine className="w-5 h-5" />
              </button>

              {getPaginationItems().map((item, index) => (
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={cn(
                      "px-3 py-1 rounded transition-colors",
                      currentPage === item
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {item}
                  </button>
                )
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 
                         disabled:cursor-not-allowed transition-colors"
              >
                <RiArrowRightSLine className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Preview Modal */}
      {previewImage.url && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={handleClosePreview}
        >
          <div className="absolute top-4 right-4">
            {/** reuse uploaded image */}
            <button
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="使用图片"
              onClick={() => {
                setUploadImage({ id: previewImage.id, url: previewImage.url });
              }}
            >
              <RiUploadLine className="w-8 h-8" />
            </button>
            <button
              title="关闭"
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              onClick={handleClosePreview}
            >
              <RiCloseLine className="w-8 h-8" />
            </button>
          </div>
          
          <div className="max-w-7xl max-h-full flex flex-col items-center">
            <img 
              src={previewImage.url} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}



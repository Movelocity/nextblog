'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  RiUploadLine, 
  RiImageLine, 
  RiRefreshLine,
  RiCloseLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiEyeLine,
  RiEditLine,
  RiDeleteBinLine,
  RiAddLine,
  RiRepeatLine,
} from 'react-icons/ri';
import cn from 'classnames';
import { Button, Modal } from '@/app/components/ui';
import imageService, { ImageEditTask } from '@/app/services/image';
import { copyToClipboard } from '@/app/services/utils';
import { useToast } from '@/app/components/layout/ToastHook';

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
 * Gallery-style interface for uploading and editing images with AI
 */
export default function ImageEditPage() {
  const { showToast } = useToast();
  
  // Upload states
  const [uploadImage, setUploadImage] = useState<UploadImage>({});
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Task list states
  const [tasks, setTasks] = useState<ImageEditTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 12; // Gallery grid: 3 columns x 4 rows
  
  // Modal states
  const [previewImage, setPreviewImage] = useState<UploadImage>({});
  const [promptModal, setPromptModal] = useState<{ task: ImageEditTask | null }>({ task: null });
  const [editModal, setEditModal] = useState<{ task: ImageEditTask | null }>({ task: null });
  const [editPrompt, setEditPrompt] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  
  // Polling state
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTaskIdsRef = useRef<Set<string>>(new Set());

  /**
   * Load tasks on mount
   */
  useEffect(() => {
    handleRefreshTasks();
    window.dispatchEvent(new CustomEvent("update-title", { detail: { title: "AI 图片编辑" } }));
    
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
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
        
        if (width <= maxSize && height <= maxSize) {
          resolve({ file, size: { w: width, h: height } });
          return;
        }
        
        const ratio = Math.min(maxSize / width, maxSize / height);
        const newWidth = Math.round(width * ratio);
        const newHeight = Math.round(height * ratio);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ file, size: { w: width, h: height } });
          return;
        }
        
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        
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
      const { file: processedFile, size } = await resizeImageIfNeeded(file);
      const url = URL.createObjectURL(processedFile);
      setUploadImage({ url, file: processedFile, size });
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
      allTasks.sort((a, b) => b.updated_at - a.updated_at);
      setTasks(allTasks);
      return allTasks;
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showToast('加载任务列表失败', 'error');
      return [];
    } finally {
      setIsLoadingTasks(false);
    }
  };

  /**
   * Stops polling for task updates
   */
  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    pollingTaskIdsRef.current.clear();
  };

  /**
   * Starts polling for task updates
   */
  const startPolling = (taskIds: string[]) => {
    stopPolling();
    
    pollingTaskIdsRef.current = new Set(taskIds);
    
    pollingTimerRef.current = setInterval(async () => {
      const allTasks = await handleRefreshTasks();
      
      // Remove completed/failed tasks from polling
      allTasks.forEach(task => {
        if (pollingTaskIdsRef.current.has(task.id) && 
            (task.status === 'completed' || task.status === 'failed')) {
          pollingTaskIdsRef.current.delete(task.id);
        }
      });
      
      // Stop polling if no tasks left
      if (pollingTaskIdsRef.current.size === 0) {
        stopPolling();
      }
    }, 10000); // 10 seconds interval
  };

  /**
   * Handles submit (upload and start edit)
   */
  const handleSubmit = async () => {
    if (!prompt.trim()) {
      showToast('请输入编辑提示词', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageId = uploadImage.id;
      
      if (!imageId) {
        if (!uploadImage.file) {
          showToast('请先选择图片', 'error');
          return;
        }
        const uploadResult = await imageService.asset.uploadImage(uploadImage.file, true);
        imageId = uploadResult.id;
      }

      if (!imageId) {
        showToast('图片上传失败', 'error');
        return;
      }
      
      const result = await imageService.edit.startEditTask({
        orig_img: imageId,
        prompt: prompt.trim()
      });
      
      setUploadImage({});
      setPrompt('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      await handleRefreshTasks();
      startPolling([result.task_id]);
      showToast('任务已提交', 'success');
      
    } catch (error) {
      console.error('Failed to submit task:', error);
      showToast('提交任务失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Creates a new task from an existing image
   */
  const handleCreateFromImage = async (imageId: string, currentPrompt?: string) => {
    const newPrompt = prompt.trim() || currentPrompt || '';
    if (!newPrompt) {
      showToast('请输入编辑提示词', 'error');
      return;
    }

    try {
      const result = await imageService.edit.startEditTask({
        orig_img: imageId,
        prompt: newPrompt
      });
      
      await handleRefreshTasks();
      startPolling([result.task_id]);
      showToast('任务已提交', 'success');
    } catch (error) {
      console.error('Failed to create task:', error);
      showToast('创建任务失败', 'error');
    }
  };

  /**
   * Retries a failed task
   */
  const handleRetryTask = async (task: ImageEditTask) => {
    try {
      await imageService.edit.retryTask(task.id);
      await handleRefreshTasks();
      startPolling([task.id]);
      showToast('任务已重试', 'success');
    } catch (error) {
      console.error('Failed to retry task:', error);
      showToast('重试任务失败', 'error');
    }
  };

  /**
   * Creates a new task from a completed task (success retry)
   */
  const handleRetrySuccess = async (task: ImageEditTask) => {
    if (!task.result_image) {
      showToast('任务尚未完成', 'error');
      return;
    }
    
    setEditModal({ task });
    setEditPrompt(task.prompt);
  };

  /**
   * Updates task prompt
   */
  const handleUpdatePrompt = async () => {
    const task = editModal.task;
    if (!task || !editPrompt.trim()) {
      return;
    }

    try {
      // For failed tasks, retry with new prompt (task override)
      if (task.status === 'failed') {
        await imageService.edit.retryTask(task.id, editPrompt.trim());
        await handleRefreshTasks();
        startPolling([task.id]);
        showToast('任务已重试', 'success');
      } else {
        // For completed tasks, create new task from result image
        const imageId = task.result_image || task.original_image;
        const result = await imageService.edit.startEditTask({
          orig_img: imageId,
          prompt: editPrompt.trim()
        });
        await handleRefreshTasks();
        startPolling([result.task_id]);
        showToast('新任务已创建', 'success');
      }
      
      setEditModal({ task: null });
      setEditPrompt('');
    } catch (error) {
      console.error('Failed to update task:', error);
      showToast('操作失败', 'error');
    }
  };

  /**
   * Deletes a task
   */
  const handleDeleteTask = async (task: ImageEditTask) => {
    if (!confirm('确定要删除这个任务吗？')) {
      return;
    }

    try {
      await imageService.edit.deleteTask(task.id);
      await handleRefreshTasks();
      showToast('任务已删除', 'success');
    } catch (error) {
      console.error('Failed to delete task:', error);
      showToast('删除任务失败', 'error');
    }
  };

  /**
   * Opens preview modal
   */
  const handlePreviewImage = (imageId: string) => {
    setPreviewImage({ id: imageId, url: imageService.asset.getImageUrl(imageId) });
  };

  /**
   * Closes preview modal
   */
  const handleClosePreview = () => {
    setPreviewImage({});
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
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);
      
      if (currentPage > 3) {
        items.push('ellipsis');
      }
      
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

  /**
   * Gets display image for a task (result if available, otherwise original)
   */
  const getTaskDisplayImage = (task: ImageEditTask): string => {
    return task.result_image || task.original_image;
  };

  /**
   * Gets thumbnail URL for a task
   */
  const getTaskThumbnailUrl = (task: ImageEditTask): string => {
    const imageId = getTaskDisplayImage(task);
    return imageService.asset.getThumbnailUrl(imageId);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Upload Section */}
        <div className="mb-6 rounded-lg border border-border p-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            上传图片
          </label>
          <div
            ref={uploadAreaRef}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative h-32 border-2 border-dashed border-border rounded-lg",
              "hover:border-blue-500 transition-colors cursor-pointer overflow-hidden",
            )}
          >
            {uploadImage.url ? (
              <img 
                src={uploadImage.url}
                alt="Preview" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <RiUploadLine className="w-8 h-8 mb-2" />
                <p className="text-sm">点击上传或粘贴图片</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg, image/png, image/webp, image/gif"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
          
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="输入编辑提示词..."
              className={cn(
                "flex-1 px-4 py-2 border border-border rounded-lg",
                "bg-transparent text-foreground",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!uploadImage.url || !prompt.trim() || isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                       text-white rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              {isSubmitting ? '提交中...' : '提交'}
            </button>
            <button
              onClick={handleRefreshTasks}
              disabled={isLoadingTasks}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted
                        transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RiRefreshLine className={cn("w-4 h-4", isLoadingTasks && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="mb-6">
          {currentTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-background rounded-lg border border-border">
              暂无任务
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentTasks.map((task) => {
                const displayImageId = getTaskDisplayImage(task);
                const thumbnailUrl = getTaskThumbnailUrl(task);
                const isCompleted = task.status === 'completed';
                const isFailed = task.status === 'failed';
                const isProcessing = task.status === 'processing';
                
                return (
                  <div
                    key={task.id}
                    className="bg-background rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-square bg-muted group">
                      <img
                        src={thumbnailUrl}
                        alt={task.prompt}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Action Buttons Overlay */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePreviewImage(displayImageId)}
                          className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded text-white transition-colors"
                          title="预览"
                        >
                          <RiEyeLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditModal({ task });
                            setEditPrompt(task.prompt);
                          }}
                          className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded text-white transition-colors"
                          title="修改"
                        >
                          <RiEditLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded text-white transition-colors"
                          title="删除"
                        >
                          <RiDeleteBinLine className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          isCompleted && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                          isProcessing && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                          isFailed && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        )}>
                          {isCompleted && '已完成'}
                          {isProcessing && '处理中'}
                          {isFailed && '失败'}
                        </span>
                      </div>

                      {/* Action Buttons for Completed/Failed Tasks */}
                      {isFailed && (
                        <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryTask(task);
                            }}
                            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                          >
                            <RiRepeatLine className="w-3 h-3" />
                            重试
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Prompt Text */}
                    <div
                      className="p-3 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setPromptModal({ task })}
                    >
                      <p className="text-sm text-foreground line-clamp-1">
                        {task.prompt}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(task.updated_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mb-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded hover:bg-muted disabled:opacity-30 
                       disabled:cursor-not-allowed transition-colors"
            >
              <RiArrowLeftSLine className="w-5 h-5" />
            </button>

            {getPaginationItems().map((item, index) => (
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={cn(
                    "px-3 py-1 rounded transition-colors",
                    currentPage === item
                      ? "bg-blue-600 text-white"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  {item}
                </button>
              )
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <RiArrowRightSLine className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage.url && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={handleClosePreview}
        >
          <div className="absolute top-4 right-4 flex gap-2">
            {/* <button
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="使用图片"
              onClick={(e) => {
                e.stopPropagation();
                setUploadImage({ id: previewImage.id, url: previewImage.url });
                handleClosePreview();
              }}
            >
              <RiUploadLine className="w-8 h-8" />
            </button> */}
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

      {/* Prompt Modal */}
      {promptModal.task && (
        <Modal
          isOpen={promptModal.task !== null}
          onClose={() => setPromptModal({ task: null })}
          title="提示词"
          size="md"
        >
          <p className="text-foreground my-3 mx-6 whitespace-pre-wrap">{promptModal.task.prompt}</p>
          <div className="flex gap-3 justify-end m-4">
            <Button
              onClick={() => {
                copyToClipboard(promptModal.task!.prompt).then(success => {
                  if (success) {
                    showToast('提示词已复制', 'success');
                  } else {
                    showToast('复制失败', 'error');
                  }
                });
              }}
              size="sm"
              variant="outline"
            >
              复制
              </Button>
            <Button
              onClick={() => {
                setPrompt(promptModal.task!.prompt);
                setPromptModal({ task: null });
              }}
              size="sm"
              variant="primary"
            >
              使用此提示词
            </Button>
          </div>
        </Modal>

      )}

      {editModal.task && (
        <Modal
          isOpen={editModal.task !== null}
          onClose={() => setEditModal({ task: null })}
          title="修改提示词"
          size="md"
        >
          <div className="mx-4 my-2">
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="输入编辑提示词..."
              className={cn(
                "w-full px-4 py-3 border border-border rounded-lg",
                "bg-transparent text-foreground resize-none",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )}
              rows={6}
            />
          </div>
          <div className="flex gap-2 justify-end pb-3 px-3">
            <Button
              onClick={() => {
                setEditModal({ task: null });
                setEditPrompt('');
              }}
              size="sm"
              variant="outline"
            >
              取消
            </Button>
            <Button
              onClick={handleUpdatePrompt}
              disabled={!editPrompt.trim()}
              size="sm"
              variant="primary"
            >
              {editModal?.task?.status === 'failed' ? '重试' : '创建'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

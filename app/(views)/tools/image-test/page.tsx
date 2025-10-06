'use client';

import { useState, useRef } from 'react';
import { 
  RiUploadLine, 
  RiImageLine, 
  RiEditLine, 
  RiDeleteBinLine,
  RiDownloadLine,
  RiEyeLine,
  RiRefreshLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiTimeLine
} from 'react-icons/ri';
import Button from '@/app/components/ui/Button';
import cn from 'classnames';
import imageService, { ImageEditTask } from '@/app/services/image';

/**
 * Image API Testing Tool Page
 * Provides functionality to test image upload, editing, and asset management APIs
 */
export default function ImageTestPage() {
  // States for file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string>('');
  const [generateThumbnail, setGenerateThumbnail] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  // States for image editing
  const [editPrompt, setEditPrompt] = useState('');
  const [currentTask, setCurrentTask] = useState<ImageEditTask | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [taskId, setTaskId] = useState('');
  
  // States for UI
  const [messages, setMessages] = useState<Array<{id: string, type: 'success' | 'error' | 'info', text: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Adds a message to the message list
   */
  const addMessage = (type: 'success' | 'error' | 'info', text: string) => {
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, type, text }]);
    // Auto remove after 5 seconds
    setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== id));
    }, 5000);
  };

  /**
   * Handles file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        addMessage('error', '请选择图片文件');
        return;
      }
      setSelectedFile(file);
      addMessage('info', `已选择文件: ${file.name}`);
    }
  };

  /**
   * Handles image upload
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      addMessage('error', '请先选择文件');
      return;
    }

    setUploadLoading(true);
    try {
      const result = await imageService.asset.uploadImage(selectedFile, generateThumbnail);
      setUploadedImageId(result.id);
      addMessage('success', `图片上传成功! ID: ${result.id}`);
    } catch (error) {
      addMessage('error', `上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setUploadLoading(false);
    }
  };

  /**
   * Handles starting image edit task
   */
  const handleStartEdit = async () => {
    if (!uploadedImageId) {
      addMessage('error', '请先上传图片');
      return;
    }
    if (!editPrompt.trim()) {
      addMessage('error', '请输入编辑指令');
      return;
    }

    setEditLoading(true);
    try {
      const result = await imageService.edit.startEditTask({
        orig_img: uploadedImageId,
        prompt: editPrompt.trim()
      });
      setTaskId(result.task_id);
      addMessage('success', `编辑任务已开始! 任务ID: ${result.task_id}`);
      
      // Start polling
      handlePollStatus(result.task_id);
    } catch (error) {
      addMessage('error', `启动编辑任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setEditLoading(false);
    }
  };

  /**
   * Handles polling task status
   */
  const handlePollStatus = async (taskIdToPoll?: string) => {
    const targetTaskId = taskIdToPoll || taskId;
    if (!targetTaskId) {
      addMessage('error', '请先开始编辑任务或输入任务ID');
      return;
    }

    try {
      addMessage('info', '开始轮询任务状态...');
      const result = await imageService.edit.pollTaskStatus(targetTaskId, 2000, 150);
      setCurrentTask(result);
      
      if (result.status === 'completed') {
        addMessage('success', '图片编辑完成!');
      } else if (result.status === 'failed') {
        addMessage('error', `编辑失败: ${result.message || '未知错误'}`);
      }
    } catch (error) {
      addMessage('error', `轮询失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  /**
   * Handles checking single task status
   */
  const handleCheckStatus = async () => {
    if (!taskId) {
      addMessage('error', '请输入任务ID');
      return;
    }

    try {
      const result = await imageService.edit.getTaskStatus(taskId);
      setCurrentTask(result);
      addMessage('info', `任务状态: ${result.status}`);
    } catch (error) {
      addMessage('error', `获取状态失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  /**
   * Handles stopping task
   */
  const handleStopTask = async () => {
    if (!taskId) {
      addMessage('error', '请输入任务ID');
      return;
    }

    try {
      await imageService.edit.stopTask(taskId);
      addMessage('success', '任务已停止');
    } catch (error) {
      addMessage('error', `停止任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  /**
   * Handles deleting task
   */
  const handleDeleteTask = async () => {
    if (!taskId) {
      addMessage('error', '请输入任务ID');
      return;
    }

    try {
      await imageService.edit.deleteTask(taskId);
      addMessage('success', '任务已删除');
      setCurrentTask(null);
      setTaskId('');
    } catch (error) {
      addMessage('error', `删除任务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  /**
   * Handles deleting image
   */
  const handleDeleteImage = async () => {
    if (!uploadedImageId) {
      addMessage('error', '请先上传图片');
      return;
    }

    try {
      await imageService.asset.deleteImage(uploadedImageId);
      addMessage('success', '图片已删除');
      setUploadedImageId('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      addMessage('error', `删除图片失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            图片 API 测试工具
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            测试图片上传、编辑和资产管理功能
          </p>
        </div>

        {/* Messages */}
        {messages.length > 0 && (
          <div className="mb-6 space-y-2">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={cn(
                  "p-3 rounded-lg flex items-center gap-2",
                  msg.type === 'success' && "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
                  msg.type === 'error' && "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
                  msg.type === 'info' && "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                )}
              >
                {msg.type === 'success' && <RiCheckLine className="w-5 h-5" />}
                {msg.type === 'error' && <RiErrorWarningLine className="w-5 h-5" />}
                {msg.type === 'info' && <RiTimeLine className="w-5 h-5" />}
                <span className="text-sm">{msg.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Asset Management */}
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <RiUploadLine className="w-5 h-5" />
                图片上传
              </h2>
              
              <div className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                             file:mr-4 file:py-2 file:px-4
                             file:rounded-lg file:border-0
                             file:text-sm file:font-medium
                             file:bg-blue-50 file:text-blue-700
                             dark:file:bg-blue-900 dark:file:text-blue-300
                             hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="generateThumbnail"
                    checked={generateThumbnail}
                    onChange={(e) => setGenerateThumbnail(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                  <label htmlFor="generateThumbnail" className="text-sm text-gray-700 dark:text-gray-300">
                    生成缩略图
                  </label>
                </div>
                
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadLoading}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 
                           text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RiUploadLine className="w-4 h-4" />
                  {uploadLoading ? '上传中...' : '上传图片'}
                </button>
              </div>
            </div>

            {/* Image Preview & Management */}
            {uploadedImageId && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <RiImageLine className="w-5 h-5" />
                  图片预览与管理
                </h2>
                
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    图片ID: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{uploadedImageId}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">原图</p>
                      <img 
                        src={imageService.asset.getImageUrl(uploadedImageId)}
                        alt="Uploaded"
                        className="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    {generateThumbnail && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">缩略图</p>
                        <img 
                          src={imageService.asset.getThumbnailUrl(uploadedImageId)}
                          alt="Thumbnail"
                          className="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(imageService.asset.getImageUrl(uploadedImageId), '_blank')}
                      className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg 
                               transition-colors flex items-center justify-center gap-2"
                    >
                      <RiEyeLine className="w-4 h-4" />
                      查看
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = imageService.asset.getImageUrl(uploadedImageId);
                        link.download = `image_${uploadedImageId}`;
                        link.click();
                      }}
                      className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg 
                               transition-colors flex items-center justify-center gap-2"
                    >
                      <RiDownloadLine className="w-4 h-4" />
                      下载
                    </button>
                    <button
                      onClick={handleDeleteImage}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg 
                               transition-colors flex items-center justify-center gap-2"
                    >
                      <RiDeleteBinLine className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Image Editing */}
          <div className="space-y-6">
            {/* Image Editing Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <RiEditLine className="w-5 h-5" />
                图片编辑
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    编辑指令
                  </label>
                  <textarea
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="例如：将背景改为蓝色，给人物添加帽子"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                             bg-white dark:bg-zinc-800 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                
                <button
                  onClick={handleStartEdit}
                  disabled={!uploadedImageId || !editPrompt.trim() || editLoading}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 
                           text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RiEditLine className="w-4 h-4" />
                  {editLoading ? '启动中...' : '开始编辑'}
                </button>
              </div>
            </div>

            {/* Task Management Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <RiRefreshLine className="w-5 h-5" />
                任务管理
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    任务ID
                  </label>
                  <input
                    type="text"
                    value={taskId}
                    onChange={(e) => setTaskId(e.target.value)}
                    placeholder="输入任务ID或自动填入"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                             bg-white dark:bg-zinc-800 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCheckStatus}
                    disabled={!taskId}
                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 
                             text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RiRefreshLine className="w-4 h-4" />
                    检查状态
                  </button>
                  <button
                    onClick={() => handlePollStatus()}
                    disabled={!taskId}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 
                             text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RiTimeLine className="w-4 h-4" />
                    轮询完成
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleStopTask}
                    disabled={!taskId}
                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 
                             text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    停止任务
                  </button>
                  <button
                    onClick={handleDeleteTask}
                    disabled={!taskId}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 
                             text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RiDeleteBinLine className="w-4 h-4" />
                    删除任务
                  </button>
                </div>
              </div>
            </div>

            {/* Task Status Display */}
            {currentTask && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  任务状态
                </h2>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">状态:</span>
                      <span className={cn(
                        "ml-2 px-2 py-1 rounded text-xs font-medium",
                        currentTask.status === 'completed' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                        currentTask.status === 'processing' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                        currentTask.status === 'failed' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      )}>
                        {currentTask.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">任务ID:</span>
                      <span className="ml-2 font-mono text-xs">{currentTask.id}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">编辑指令:</span>
                    <p className="mt-1 text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">{currentTask.prompt}</p>
                  </div>
                  
                  {currentTask.message && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">消息:</span>
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{currentTask.message}</p>
                    </div>
                  )}
                  
                  {currentTask.result_image && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 text-sm">编辑结果:</span>
                      <div className="mt-2">
                        <img 
                          src={imageService.asset.getImageUrl(currentTask.result_image)}
                          alt="Edited result"
                          className="w-full max-w-md h-48 object-cover rounded border border-gray-200 dark:border-gray-700"
                        />
                        <div className="mt-2 flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            icon={<RiEyeLine />}
                            text="查看大图"
                            onClick={() => window.open(imageService.asset.getImageUrl(currentTask.result_image!), '_blank')}
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<RiDownloadLine />}
                            text="下载"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = imageService.asset.getImageUrl(currentTask.result_image!);
                              link.download = `edited_${currentTask.result_image}`;
                              link.click();
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

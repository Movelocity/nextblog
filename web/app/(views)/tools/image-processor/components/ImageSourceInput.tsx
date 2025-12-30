'use client';

import { useRef, useCallback, useEffect } from 'react';
import { RiUploadLine, RiImageLine, RiFileCopyLine } from 'react-icons/ri';
import { useImageProcessorStore } from '@/app/stores/ImageProcessorStore';
import { fileToBase64, loadImageFromBase64 } from '../utils/imageUtils';
import { useToast } from '@/app/components/layout/ToastHook';

/**
 * 图片源输入组件
 */
export const ImageSourceInput = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    imageState,
    urlInput,
    isLoadingUrl,
    setImageState,
    setUrlInput,
    setIsLoadingUrl,
    setScaleWidth,
    setScaleHeight,
    resetProcessingParams,
  } = useImageProcessorStore();

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('请上传图片文件', 'error');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const state = await loadImageFromBase64(base64);
      setImageState(state);
      setScaleWidth(state.width);
      setScaleHeight(state.height);
      showToast('图片加载成功', 'success');
      resetProcessingParams();
    } catch (error) {
      showToast('图片加载失败', 'error');
    }
  };

  /**
   * 处理粘贴事件
   */
  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            try {
              const base64 = await fileToBase64(file);
              const state = await loadImageFromBase64(base64);
              setImageState(state);
              setScaleWidth(state.width);
              setScaleHeight(state.height);
              showToast('图片从剪贴板加载成功', 'success');
              resetProcessingParams();
            } catch (error) {
              showToast('图片加载失败', 'error');
            }
          }
          e.preventDefault();
          break;
        }
      }
    },
    [showToast, setImageState, setScaleWidth, setScaleHeight, resetProcessingParams]
  );

  /**
   * 处理 URL 加载
   */
  const handleUrlLoad = async () => {
    if (!urlInput.trim()) {
      showToast('请输入图片 URL', 'error');
      return;
    }

    setIsLoadingUrl(true);
    try {
      const response = await fetch(urlInput);
      const blob = await response.blob();
      const file = new File([blob], 'image.png', { type: blob.type });
      const base64 = await fileToBase64(file);
      const state = await loadImageFromBase64(base64);
      setImageState(state);
      setScaleWidth(state.width);
      setScaleHeight(state.height);
      showToast('图片从 URL 加载成功', 'success');
      resetProcessingParams();
    } catch (error) {
      showToast('无法加载 URL 图片，可能存在跨域限制', 'error');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  // 添加粘贴事件监听
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <RiUploadLine className="text-xl" />
        图像源
      </h2>

      {/* 文件上传 */}
      <div className="mb-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RiImageLine className="text-xl" />
          选择本地文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* URL 输入 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          从 URL 加载
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
            />
          </div>
          <button
            onClick={handleUrlLoad}
            disabled={isLoadingUrl}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 text-nowrap"
          >
            {isLoadingUrl ? '加载中...' : '加载'}
          </button>
        </div>
      </div>

      {/* 粘贴提示 */}
      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        <RiFileCopyLine className="inline text-lg mr-1" />
        提示：可直接使用 Ctrl/Cmd+V 粘贴图片
      </div>

      {/* 图片信息 */}
      {imageState && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>
              尺寸: {imageState.width} × {imageState.height}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


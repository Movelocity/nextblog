'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RiUploadLine, 
  RiImageLine, 
  RiScissorsLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiCheckLine,
  RiArrowGoBackLine,
  RiPaintBrushLine
} from 'react-icons/ri';
import { useToast } from '@/app/components/layout/ToastHook';
import { ImagePreview } from './';

interface ImageState {
  originalBase64: string;
  processedBase64: string;
  width: number;
  height: number;
}

type BackgroundType = 'transparent' | 'white' | 'custom';
type ExportFormat = 'png' | 'jpg' | 'webp' | 'ico';

/**
 * Image Processor Tool - Pure frontend image processing
 */
export default function ImageProcessorPage() {
  const { showToast } = useToast();
  
  // Image state
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  
  // Processing parameters
  const [cropEnabled, setCropEnabled] = useState(false);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(100);
  const [cropHeight, setCropHeight] = useState(100);
  const [appliedCrop, setAppliedCrop] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [borderRadius, setBorderRadius] = useState(0);
  const [padding, setPadding] = useState(0);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('transparent');
  const [customBgColor, setCustomBgColor] = useState('#ffffff');
  
  // Export parameters
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [jpgQuality, setJpgQuality] = useState(92);
  const [exportSize, setExportSize] = useState<string>('');
  const [scaleEnabled, setScaleEnabled] = useState(false);
  const [scaleWidth, setScaleWidth] = useState(0);
  const [scaleHeight, setScaleHeight] = useState(0);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [scalePercent, setScalePercent] = useState(100);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Convert file to base64
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Load image from base64
   */
  const loadImageFromBase64 = (base64: string): Promise<ImageState> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          originalBase64: base64,
          processedBase64: base64,
          width: img.width,
          height: img.height
        });
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  /**
   * Handle file upload
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
   * Handle paste from clipboard
   */
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
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
  }, [showToast]);

  /**
   * Handle URL input
   */
  const handleUrlLoad = async () => {
    if (!urlInput.trim()) {
      showToast('请输入图片 URL', 'error');
      return;
    }

    setIsLoadingUrl(true);
    try {
      // Use a proxy or direct fetch
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

  /**
   * Reset processing parameters
   */
  const resetProcessingParams = () => {
    setCropEnabled(false);
    setCropX(0);
    setCropY(0);
    setCropWidth(100);
    setCropHeight(100);
    setAppliedCrop(null);
    setBorderRadius(0);
    setPadding(0);
    setBackgroundType('transparent');
    setScaleEnabled(false);
    setScalePercent(100);
    setKeepAspectRatio(true);
  };

  /**
   * Handle crop change from ImagePreview
   */
  const handleCropChange = useCallback((x: number, y: number, width: number, height: number) => {
    setCropX(x);
    setCropY(y);
    setCropWidth(width);
    setCropHeight(height);
  }, []);

  /**
   * Apply crop - called when exiting crop mode
   */
  const handleApplyCrop = useCallback(() => {
    if (cropEnabled) {
      // Save crop parameters and exit crop mode
      setAppliedCrop({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
      setCropEnabled(false);
      showToast('裁剪已应用', 'success');
    }
  }, [cropEnabled, cropX, cropY, cropWidth, cropHeight, showToast]);

  /**
   * Cancel crop - exit crop mode without applying
   */
  const handleCancelCrop = useCallback(() => {
    setCropEnabled(false);
    // Restore previous crop if there was one
    if (appliedCrop) {
      setCropX(appliedCrop.x);
      setCropY(appliedCrop.y);
      setCropWidth(appliedCrop.width);
      setCropHeight(appliedCrop.height);
    } else {
      setCropX(0);
      setCropY(0);
      setCropWidth(100);
      setCropHeight(100);
    }
    showToast('已取消裁剪', 'info');
  }, [appliedCrop, showToast]);

  /**
   * Toggle crop mode
   */
  const handleToggleCropMode = useCallback((enabled: boolean) => {
    if (enabled) {
      // Entering crop mode - use applied crop or defaults
      if (appliedCrop) {
        setCropX(appliedCrop.x);
        setCropY(appliedCrop.y);
        setCropWidth(appliedCrop.width);
        setCropHeight(appliedCrop.height);
      }
      setCropEnabled(true);
    } else {
      // Exiting crop mode - this shouldn't happen via checkbox anymore
      setCropEnabled(false);
    }
  }, [appliedCrop]);

  /**
   * Process image with current parameters
   */
  const processImage = useCallback(async () => {
    if (!imageState || !canvasRef.current) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      // Calculate crop dimensions
      let srcX = 0;
      let srcY = 0;
      let srcWidth = img.width;
      let srcHeight = img.height;

      // Only apply crop if it was confirmed (not in preview mode)
      if (appliedCrop && !cropEnabled) {
        srcX = (appliedCrop.x / 100) * img.width;
        srcY = (appliedCrop.y / 100) * img.height;
        srcWidth = (appliedCrop.width / 100) * img.width;
        srcHeight = (appliedCrop.height / 100) * img.height;
      }

      // Calculate final dimensions with padding
      const finalWidth = srcWidth + padding * 2;
      const finalHeight = srcHeight + padding * 2;

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      // Clear canvas
      ctx.clearRect(0, 0, finalWidth, finalHeight);

      // Apply background
      if (backgroundType !== 'transparent') {
        ctx.fillStyle = backgroundType === 'white' ? '#ffffff' : customBgColor;
        
        if (borderRadius > 0) {
          // Draw rounded rectangle background
          const radius = Math.min(borderRadius, finalWidth / 2, finalHeight / 2);
          ctx.beginPath();
          ctx.moveTo(radius, 0);
          ctx.lineTo(finalWidth - radius, 0);
          ctx.quadraticCurveTo(finalWidth, 0, finalWidth, radius);
          ctx.lineTo(finalWidth, finalHeight - radius);
          ctx.quadraticCurveTo(finalWidth, finalHeight, finalWidth - radius, finalHeight);
          ctx.lineTo(radius, finalHeight);
          ctx.quadraticCurveTo(0, finalHeight, 0, finalHeight - radius);
          ctx.lineTo(0, radius);
          ctx.quadraticCurveTo(0, 0, radius, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, finalWidth, finalHeight);
        }
      }

      // Apply border radius clipping
      if (borderRadius > 0) {
        ctx.save();
        const radius = Math.min(borderRadius, finalWidth / 2, finalHeight / 2);
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(finalWidth - radius, 0);
        ctx.quadraticCurveTo(finalWidth, 0, finalWidth, radius);
        ctx.lineTo(finalWidth, finalHeight - radius);
        ctx.quadraticCurveTo(finalWidth, finalHeight, finalWidth - radius, finalHeight);
        ctx.lineTo(radius, finalHeight);
        ctx.quadraticCurveTo(0, finalHeight, 0, finalHeight - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();
      }

      // Draw image
      ctx.drawImage(
        img,
        srcX, srcY, srcWidth, srcHeight,
        padding, padding, srcWidth, srcHeight
      );

      if (borderRadius > 0) {
        ctx.restore();
      }

      // Update processed base64
      const processedBase64 = canvas.toDataURL('image/png');
      setImageState(prev => prev ? { ...prev, processedBase64 } : null);
    };

    img.src = imageState.originalBase64;
  }, [imageState, appliedCrop, cropEnabled, borderRadius, padding, backgroundType, customBgColor]);

  /**
   * Create export canvas with scaling
   */
  const createExportCanvas = useCallback(() => {
    if (!canvasRef.current) return null;

    const sourceCanvas = canvasRef.current;
    
    if (!scaleEnabled) {
      return sourceCanvas;
    }

    // Create a new canvas for scaling
    const exportCanvas = document.createElement('canvas');
    const targetWidth = Math.round((scalePercent / 100) * sourceCanvas.width);
    const targetHeight = Math.round((scalePercent / 100) * sourceCanvas.height);
    
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;
    
    const ctx = exportCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw scaled image
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    
    return exportCanvas;
  }, [scaleEnabled, scalePercent]);

  /**
   * Calculate export size
   */
  const calculateExportSize = useCallback(async () => {
    if (!imageState || !canvasRef.current) return;

    const canvas = createExportCanvas();
    if (!canvas) return;

    let mimeType = 'image/png';
    let quality = 1.0;

    switch (exportFormat) {
      case 'jpg':
        mimeType = 'image/jpeg';
        quality = jpgQuality / 100;
        break;
      case 'webp':
        mimeType = 'image/webp';
        quality = 0.92;
        break;
      case 'ico':
        // ICO is a special case, we'll use PNG as fallback
        mimeType = 'image/png';
        break;
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const sizeInKB = (blob.size / 1024).toFixed(2);
        const dimensions = scaleEnabled 
          ? `${canvas.width} × ${canvas.height}` 
          : `${canvasRef.current!.width} × ${canvasRef.current!.height}`;
        setExportSize(`${dimensions} · ${sizeInKB} KB`);
      }
    }, mimeType, quality);
  }, [imageState, exportFormat, jpgQuality, createExportCanvas, scaleEnabled]);

  /**
   * Export image
   */
  const handleExport = () => {
    if (!canvasRef.current) return;

    const canvas = createExportCanvas();
    if (!canvas) return;

    let mimeType = 'image/png';
    let quality = 1.0;
    let extension = exportFormat;

    switch (exportFormat) {
      case 'jpg':
        mimeType = 'image/jpeg';
        quality = jpgQuality / 100;
        break;
      case 'webp':
        mimeType = 'image/webp';
        quality = 0.92;
        break;
      case 'ico':
        mimeType = 'image/png';
        extension = 'png'; // Browser doesn't support ICO export directly
        showToast('ICO 格式将导出为 PNG', 'info');
        break;
    }

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed-image-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('图片导出成功', 'success');
    }, mimeType, quality);
  };

  /**
   * Copy to clipboard
   */
  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        
        showToast('已复制到剪贴板', 'success');
      });
    } catch (error) {
      showToast('复制失败', 'error');
    }
  };

  /**
   * Reset to original
   */
  const handleReset = () => {
    if (!imageState) return;
    
    setImageState(prev => prev ? {
      ...prev,
      processedBase64: prev.originalBase64
    } : null);
    
    resetProcessingParams();
    showToast('已重置为原图', 'success');
  };

  /**
   * Clear image
   */
  const handleClear = () => {
    setImageState(null);
    setUrlInput('');
    setExportSize('');
    resetProcessingParams();
  };

  // Process image when parameters change (but not during crop preview)
  useEffect(() => {
    if (imageState && !cropEnabled) {
      processImage();
    }
  }, [imageState?.originalBase64, cropEnabled, appliedCrop, borderRadius, padding, backgroundType, customBgColor, processImage]);

  // Calculate export size when format, quality, or scale changes
  useEffect(() => {
    if (imageState) {
      calculateExportSize();
    }
  }, [exportFormat, jpgQuality, scaleEnabled, scalePercent, imageState?.processedBase64, calculateExportSize]);

  // Add paste event listener
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            图像处理工具
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            纯前端图像处理，支持裁剪、圆角、边距、背景等功能
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Image Input */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <RiUploadLine className="text-xl" />
                图像源
              </h2>

              {/* File Upload */}
              <div className="mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
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

              {/* URL Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  从 URL 加载
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
                  />
                  <button
                    onClick={handleUrlLoad}
                    disabled={isLoadingUrl}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isLoadingUrl ? '加载中...' : '加载'}
                  </button>
                </div>
              </div>

              {/* Paste Hint */}
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <RiFileCopyLine className="inline text-lg mr-1" />
                提示：可直接使用 Ctrl/Cmd+V 粘贴图片
              </div>

              {/* Image Info */}
              {imageState && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <div>尺寸: {imageState.width} × {imageState.height}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Processing Controls */}
            {imageState && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <RiPaintBrushLine className="text-xl" />
                  图像处理
                </h2>

                {/* Crop */}
                <div className="mb-4">
                  {!cropEnabled ? (
                    <div>
                      <button
                        onClick={() => handleToggleCropMode(true)}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <RiScissorsLine className="text-lg" />
                        {appliedCrop ? '调整裁剪' : '开始裁剪'}
                      </button>
                      {appliedCrop && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 rounded p-2">
                          <RiCheckLine className="inline mr-1 text-green-600" />
                          已应用裁剪: {appliedCrop.width.toFixed(1)}% × {appliedCrop.height.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="space-y-3 mb-3">
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">X 偏移: {cropX.toFixed(1)}%</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={cropX}
                            onChange={(e) => setCropX(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">Y 偏移: {cropY.toFixed(1)}%</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={cropY}
                            onChange={(e) => setCropY(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">宽度: {cropWidth.toFixed(1)}%</label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="0.1"
                            value={cropWidth}
                            onChange={(e) => setCropWidth(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400">高度: {cropHeight.toFixed(1)}%</label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="0.1"
                            value={cropHeight}
                            onChange={(e) => setCropHeight(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      {/* Crop action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleApplyCrop}
                          className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                        >
                          <RiCheckLine className="text-lg" />
                          应用
                        </button>
                        <button
                          onClick={handleCancelCrop}
                          className="flex-1 py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Border Radius */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    圆角: {borderRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Padding */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    边距: {padding}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Background */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    背景
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="background"
                        checked={backgroundType === 'transparent'}
                        onChange={() => setBackgroundType('transparent')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">透明</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="background"
                        checked={backgroundType === 'white'}
                        onChange={() => setBackgroundType('white')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">白色</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="background"
                        checked={backgroundType === 'custom'}
                        onChange={() => setBackgroundType('custom')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">自定义</span>
                      {backgroundType === 'custom' && (
                        <input
                          type="color"
                          value={customBgColor}
                          onChange={(e) => setCustomBgColor(e.target.value)}
                          className="ml-2 w-10 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                      )}
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RiArrowGoBackLine />
                    重置
                  </button>
                  <button
                    onClick={handleClear}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RiDeleteBinLine />
                    清空
                  </button>
                </div>
              </div>
            )}

            {/* Export Controls */}
            {imageState && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <RiDownloadLine className="text-xl" />
                  导出设置
                </h2>

                {/* Format Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    格式
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['png', 'jpg', 'webp', 'ico'] as ExportFormat[]).map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`py-2 px-4 rounded-lg border-2 transition-all ${
                          exportFormat === format
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* JPG Quality */}
                {exportFormat === 'jpg' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      质量: {jpgQuality}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={jpgQuality}
                      onChange={(e) => setJpgQuality(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Scale Control */}
                <div className="mb-4">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={scaleEnabled}
                      onChange={(e) => setScaleEnabled(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      启用缩放
                    </span>
                  </label>
                  
                  {scaleEnabled && (
                    <div className="space-y-3 ml-6 mt-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          缩放比例: {scalePercent}%
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="400"
                          value={scalePercent}
                          onChange={(e) => setScalePercent(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                        {canvasRef.current && (
                          <>
                            原始: {canvasRef.current.width} × {canvasRef.current.height}<br/>
                            缩放后: {Math.round((scalePercent / 100) * canvasRef.current.width)} × {Math.round((scalePercent / 100) * canvasRef.current.height)}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Export Size */}
                {exportSize && (
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    预计大小: <span className="font-semibold">{exportSize}</span>
                  </div>
                )}

                {/* Export Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleExport}
                    className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <RiDownloadLine className="text-xl" />
                    下载图片
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RiFileCopyLine className="text-lg" />
                    复制到剪贴板
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-2">
            {/* Canvas for processing (hidden) */}
            <canvas ref={canvasRef} className="hidden" />
            
            <ImagePreview
              imageBase64={cropEnabled ? imageState?.originalBase64 || null : imageState?.processedBase64 || null}
              cropEnabled={cropEnabled}
              cropX={cropX}
              cropY={cropY}
              cropWidth={cropWidth}
              cropHeight={cropHeight}
              onCropChange={handleCropChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


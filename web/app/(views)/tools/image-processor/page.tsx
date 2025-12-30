'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useImageProcessorStore } from '@/app/stores/ImageProcessorStore';
import { ImagePreview } from './ImagePreview';
import { ImageSourceInput } from './components/ImageSourceInput';
import { ImageProcessControls } from './components/ImageProcessControls';
import { ImageExportControls } from './components/ImageExportControls';
import { processImageToCanvas, createExportCanvas, calculateExportSize } from './utils/canvasUtils';
import { createProcessingSignature } from './utils/imageUtils';

/**
 * Image Processor Tool - Pure frontend image processing
 * 
 * 图片处理器主页面 - 纯组合层，负责布局和副作用协调
 */
export default function ImageProcessorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastProcessParamsRef = useRef<string>('');
  const exportSizeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    imageState,
    cropEnabled,
    cropApplied,
    borderRadius,
    padding,
    backgroundType,
    customBgColor,
    exportFormat,
    jpgQuality,
    scaleEnabled,
    scaleWidth,
    scaleHeight,
    setCanvasRef,
    updateProcessedBase64,
    setExportSize,
  } = useImageProcessorStore();

  /**
   * 处理图片 - 当参数变化时重新处理
   */
  const processImage = useCallback(async () => {
    if (!imageState || !canvasRef.current || cropEnabled) return;

    // 创建参数签名避免重复处理
    const paramsSignature = createProcessingSignature({
      crop: cropApplied,
      borderRadius,
      padding,
      backgroundType,
      customBgColor: backgroundType === 'custom' ? customBgColor : null,
    });

    // 跳过相同参数
    if (lastProcessParamsRef.current === paramsSignature) {
      return;
    }
    lastProcessParamsRef.current = paramsSignature;

    // 处理图片到 Canvas
    const processedBase64 = await processImageToCanvas(canvasRef.current, imageState, {
      crop: cropApplied,
      borderRadius,
      padding,
      backgroundType,
      customBgColor,
    });

    updateProcessedBase64(processedBase64);
  }, [
    imageState,
    cropEnabled,
    cropApplied,
    borderRadius,
    padding,
    backgroundType,
    customBgColor,
    updateProcessedBase64,
  ]);

  /**
   * 计算导出文件大小（防抖）
   */
  const calculateExportSizeDebounced = useCallback(() => {
    if (!imageState || !canvasRef.current) return;

    // 清除之前的计时器
    if (exportSizeTimerRef.current) {
      clearTimeout(exportSizeTimerRef.current);
    }

    // 防抖处理
    exportSizeTimerRef.current = setTimeout(async () => {
      if (!canvasRef.current) return;

      const exportCanvas = createExportCanvas(
        canvasRef.current,
        scaleEnabled,
        scaleWidth,
        scaleHeight
      );

      const size = await calculateExportSize(exportCanvas, exportFormat, jpgQuality);
      setExportSize(size);
    }, 300);
  }, [
    imageState,
    exportFormat,
    jpgQuality,
    scaleEnabled,
    scaleWidth,
    scaleHeight,
    setExportSize,
  ]);

  // 设置 canvas ref
  useEffect(() => {
    setCanvasRef(canvasRef.current);
  }, [setCanvasRef]);

  // 处理图片当参数变化时
  useEffect(() => {
    if (imageState && !cropEnabled) {
      processImage();
    }
  }, [
    imageState?.originalBase64,
    cropEnabled,
    cropApplied,
    borderRadius,
    padding,
    backgroundType,
    customBgColor,
    processImage,
  ]);

  // 计算导出大小当格式或质量变化时
  useEffect(() => {
    if (imageState && imageState.processedBase64) {
      calculateExportSizeDebounced();
    }

    // 清理
    return () => {
      if (exportSizeTimerRef.current) {
        clearTimeout(exportSizeTimerRef.current);
      }
    };
  }, [
    exportFormat,
    jpgQuality,
    scaleEnabled,
    scaleWidth,
    scaleHeight,
    imageState?.processedBase64,
    calculateExportSizeDebounced,
  ]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Preview */}
          <div className="lg:col-span-2">
            {/* Canvas for processing (hidden) */}
            <canvas ref={canvasRef} className="hidden" />

            <ImagePreview />
          </div>

          {/* Right Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <ImageSourceInput />
            {imageState && <ImageProcessControls />}
            {imageState && <ImageExportControls />}
          </div>
        </div>
      </div>
    </div>
  );
}

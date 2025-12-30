'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RiImageLine } from 'react-icons/ri';
import { useImageProcessorStore } from '@/app/stores/ImageProcessorStore';
import { useCoordinateTransformer } from './hooks/useCoordinateTransformer';

type ResizeHandle = 
  | 'nw' | 'n' | 'ne' 
  | 'w' | 'e' 
  | 'sw' | 's' | 'se' 
  | 'move' 
  | null;

/**
 * Image Preview Component with Interactive Cropping
 */
export const ImagePreview = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // 从 store 获取状态
  const {
    imageState,
    cropEnabled,
    cropDraft,
    setCropDraft,
  } = useImageProcessorStore();

  // 初始化坐标转换器
  const { transformer: coordinateTransformer, updateTransformer } = useCoordinateTransformer(
    containerRef,
    imgRef,
    imageState?.width,
    imageState?.height
  );

  const imageBase64 = cropEnabled ? imageState?.originalBase64 : imageState?.processedBase64;
  const cropX = cropDraft.x;
  const cropY = cropDraft.y;
  const cropWidth = cropDraft.width;
  const cropHeight = cropDraft.height;

  /**
   * 处理图片加载完成 - 确保坐标转换器正确初始化
   */
  const handleImageLoad = useCallback(() => {
    // 图片加载完成后，强制更新坐标转换器
    // 使用 requestAnimationFrame 确保在下一帧更新，此时图片已完全渲染
    requestAnimationFrame(() => {
      updateTransformer();
    });
  }, [updateTransformer]);

  /**
   * 将图片坐标（百分比）转换为显示坐标（像素）用于渲染裁剪框
   */
  const getCropDisplayStyle = useCallback(() => {
    if (!coordinateTransformer) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    // 将图片坐标（百分比）转换为显示坐标（像素）
    const displayCrop = coordinateTransformer.imagePercentToDisplay(cropDraft);
    
    // 转换为容器坐标（用于 CSS 定位）
    const containerPos = coordinateTransformer.displayToContainer(displayCrop.x, displayCrop.y);

    return {
      left: containerPos.x,
      top: containerPos.y,
      width: displayCrop.width,
      height: displayCrop.height,
    };
  }, [coordinateTransformer, cropDraft]);

  /**
   * Handle mouse down on crop box
   */
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (!containerRef.current || !coordinateTransformer) return;

    e.preventDefault();
    e.stopPropagation();

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 获取鼠标相对容器的位置
    const mouseContainerX = e.clientX - containerRect.left;
    const mouseContainerY = e.clientY - containerRect.top;

    // 转换为显示坐标
    const mouseDisplay = coordinateTransformer.containerToDisplay(mouseContainerX, mouseContainerY);

    // 获取当前裁剪框的显示坐标
    const currentDisplayCrop = coordinateTransformer.imagePercentToDisplay(cropDraft);

    setIsDragging(true);
    setActiveHandle(handle);
    setDragStart({ x: mouseDisplay.x, y: mouseDisplay.y });
    setCropStart({ 
      x: currentDisplayCrop.x, 
      y: currentDisplayCrop.y, 
      width: currentDisplayCrop.width, 
      height: currentDisplayCrop.height 
    });
  }, [coordinateTransformer, cropDraft]);

  /**
   * Handle mouse move for dragging/resizing
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !activeHandle || !containerRef.current || !coordinateTransformer) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    // 获取鼠标相对容器的位置
    const mouseContainerX = e.clientX - containerRect.left;
    const mouseContainerY = e.clientY - containerRect.top;

    // 转换为显示坐标
    const mouseDisplay = coordinateTransformer.containerToDisplay(mouseContainerX, mouseContainerY);

    // 计算鼠标移动的增量（显示坐标空间）
    const deltaX = mouseDisplay.x - dragStart.x;
    const deltaY = mouseDisplay.y - dragStart.y;

    let newX = cropStart.x;
    let newY = cropStart.y;
    let newWidth = cropStart.width;
    let newHeight = cropStart.height;

    if (activeHandle === 'move') {
      // Move the entire crop box
      newX = cropStart.x + deltaX;
      newY = cropStart.y + deltaY;
    } else {
      // Resize based on handle
      if (activeHandle.includes('n')) {
        newY = cropStart.y + deltaY;
        newHeight = cropStart.height - deltaY;
      }
      if (activeHandle.includes('s')) {
        newHeight = cropStart.height + deltaY;
      }
      if (activeHandle.includes('w')) {
        newX = cropStart.x + deltaX;
        newWidth = cropStart.width - deltaX;
      }
      if (activeHandle.includes('e')) {
        newWidth = cropStart.width + deltaX;
      }
    }

    // 约束裁剪框在有效范围内
    const constrainedCrop = coordinateTransformer.constrainDisplayCrop({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });

    // 转换为图片坐标（百分比）并保存
    const imageCrop = coordinateTransformer.displayToImagePercent(constrainedCrop);

    setCropDraft({
      x: Math.round(imageCrop.x * 10) / 10,
      y: Math.round(imageCrop.y * 10) / 10,
      width: Math.round(imageCrop.width * 10) / 10,
      height: Math.round(imageCrop.height * 10) / 10,
    });
  }, [isDragging, activeHandle, dragStart, cropStart, coordinateTransformer, setCropDraft]);

  /**
   * Handle mouse up
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
  }, []);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 当切换到裁剪模式时，确保坐标转换器更新
  useEffect(() => {
    if (cropEnabled && imageState) {
      // 使用 setTimeout 确保图片已经渲染
      const timer = setTimeout(() => {
        updateTransformer();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [cropEnabled, imageState, updateTransformer]);

  /**
   * Render crop overlay
   */
  const renderCropOverlay = () => {
    if (!cropEnabled || !imageBase64 || !coordinateTransformer) return null;

    // 获取裁剪框的显示样式（容器坐标，用于 CSS 定位）
    const cropDisplayStyle = getCropDisplayStyle();

    const cropStyle = {
      left: `${cropDisplayStyle.left}px`,
      top: `${cropDisplayStyle.top}px`,
      width: `${cropDisplayStyle.width}px`,
      height: `${cropDisplayStyle.height}px`
    };

    return (
      <>
        {/* Dimmed overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top */}
          <div 
            className="absolute left-0 right-0 bg-black/50"
            style={{ 
              top: 0, 
              height: `${cropDisplayStyle.top}px` 
            }}
          />
          {/* Bottom */}
          <div 
            className="absolute left-0 right-0 bg-black/50"
            style={{ 
              top: `${cropDisplayStyle.top + cropDisplayStyle.height}px`, 
              bottom: 0 
            }}
          />
          {/* Left */}
          <div 
            className="absolute bg-black/50"
            style={{ 
              top: `${cropDisplayStyle.top}px`, 
              left: 0, 
              width: `${cropDisplayStyle.left}px`, 
              height: `${cropDisplayStyle.height}px` 
            }}
          />
          {/* Right */}
          <div 
            className="absolute bg-black/50"
            style={{ 
              top: `${cropDisplayStyle.top}px`, 
              left: `${cropDisplayStyle.left + cropDisplayStyle.width}px`, 
              right: 0, 
              height: `${cropDisplayStyle.height}px` 
            }}
          />
        </div>

        {/* Crop box */}
        <div
          className="absolute border-2 border-blue-500 cursor-move"
          style={cropStyle}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-blue-400/30" />
            ))}
          </div>

          {/* Resize handles */}
          {/* Corners */}
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white -left-1.5 -top-1.5 cursor-nw-resize"
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white -right-1.5 -top-1.5 cursor-ne-resize"
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white -left-1.5 -bottom-1.5 cursor-sw-resize"
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white -right-1.5 -bottom-1.5 cursor-se-resize"
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />

          {/* Edges */}
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white left-1/2 -translate-x-1/2 -top-1.5 cursor-n-resize"
            onMouseDown={(e) => handleMouseDown(e, 'n')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white left-1/2 -translate-x-1/2 -bottom-1.5 cursor-s-resize"
            onMouseDown={(e) => handleMouseDown(e, 's')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white -left-1.5 top-1/2 -translate-y-1/2 cursor-w-resize"
            onMouseDown={(e) => handleMouseDown(e, 'w')}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border border-white -right-1.5 top-1/2 -translate-y-1/2 cursor-e-resize"
            onMouseDown={(e) => handleMouseDown(e, 'e')}
          />

          {/* Dimension display */}
          <div className="absolute -top-7 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
            {cropWidth.toFixed(1)}% × {cropHeight.toFixed(1)}%
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-6">

      {!imageBase64 ? (
        <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400 dark:text-gray-500">
            <RiImageLine className="text-6xl mx-auto mb-4" />
            <p className="text-lg">请上传或粘贴图片开始处理</p>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="relative  rounded-lg p-8 min-h-[400px] flex items-center justify-center overflow-hidden"
          style={{ userSelect: 'none' }}
        >
          <img
            ref={imgRef}
            src={imageBase64}
            alt="Preview"
            className="max-w-full max-h-[600px] object-contain pointer-events-none"
            style={{
              imageRendering: 'crisp-edges'
            }}
            draggable={false}
            onLoad={handleImageLoad}
          />
          {renderCropOverlay()}
        </div>
      )}

    </div>
  );
};


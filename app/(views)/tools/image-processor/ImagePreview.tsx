'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RiImageLine } from 'react-icons/ri';

interface ImagePreviewProps {
  imageBase64: string | null;
  cropEnabled: boolean;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  onCropChange: (x: number, y: number, width: number, height: number) => void;
}

type ResizeHandle = 
  | 'nw' | 'n' | 'ne' 
  | 'w' | 'e' 
  | 'sw' | 's' | 'se' 
  | 'move' 
  | null;

/**
 * Image Preview Component with Interactive Cropping
 */
export const ImagePreview = ({
  imageBase64,
  cropEnabled,
  cropX,
  cropY,
  cropWidth,
  cropHeight,
  onCropChange
}: ImagePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  /**
   * Convert pixel position to percentage relative to container
   */
  const pixelToPercent = useCallback((x: number, y: number, width: number, height: number) => {
    if (!containerRef.current) return { x: 0, y: 0, width: 100, height: 100 };

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    return {
      x: Math.max(0, Math.min(100, (x / containerWidth) * 100)),
      y: Math.max(0, Math.min(100, (y / containerHeight) * 100)),
      width: Math.max(1, Math.min(100, (width / containerWidth) * 100)),
      height: Math.max(1, Math.min(100, (height / containerHeight) * 100))
    };
  }, []);

  /**
   * Convert percentage to pixel position relative to container
   */
  const percentToPixel = useCallback((x: number, y: number, width: number, height: number) => {
    if (!containerRef.current) return { x: 0, y: 0, width: 0, height: 0 };

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    return {
      x: (x / 100) * containerWidth,
      y: (y / 100) * containerHeight,
      width: (width / 100) * containerWidth,
      height: (height / 100) * containerHeight
    };
  }, []);

  /**
   * Handle mouse down on crop box
   */
  const handleMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    if (!containerRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setActiveHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStart({ x: cropX, y: cropY, width: cropWidth, height: cropHeight });
  }, [cropX, cropY, cropWidth, cropHeight]);

  /**
   * Handle mouse move for dragging/resizing
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !activeHandle || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Convert delta to percentage
    const deltaXPercent = (deltaX / containerWidth) * 100;
    const deltaYPercent = (deltaY / containerHeight) * 100;

    let newX = cropStart.x;
    let newY = cropStart.y;
    let newWidth = cropStart.width;
    let newHeight = cropStart.height;

    if (activeHandle === 'move') {
      // Move the entire crop box
      newX = cropStart.x + deltaXPercent;
      newY = cropStart.y + deltaYPercent;

      // Constrain within bounds
      newX = Math.max(0, Math.min(100 - cropStart.width, newX));
      newY = Math.max(0, Math.min(100 - cropStart.height, newY));
    } else {
      // Resize based on handle
      if (activeHandle.includes('n')) {
        newY = cropStart.y + deltaYPercent;
        newHeight = cropStart.height - deltaYPercent;
      }
      if (activeHandle.includes('s')) {
        newHeight = cropStart.height + deltaYPercent;
      }
      if (activeHandle.includes('w')) {
        newX = cropStart.x + deltaXPercent;
        newWidth = cropStart.width - deltaXPercent;
      }
      if (activeHandle.includes('e')) {
        newWidth = cropStart.width + deltaXPercent;
      }

      // Constrain minimum size
      if (newWidth < 5) {
        newWidth = 5;
        if (activeHandle.includes('w')) {
          newX = cropStart.x + cropStart.width - 5;
        }
      }
      if (newHeight < 5) {
        newHeight = 5;
        if (activeHandle.includes('n')) {
          newY = cropStart.y + cropStart.height - 5;
        }
      }

      // Constrain within bounds
      newX = Math.max(0, Math.min(100 - newWidth, newX));
      newY = Math.max(0, Math.min(100 - newHeight, newY));
      newWidth = Math.min(100 - newX, newWidth);
      newHeight = Math.min(100 - newY, newHeight);
    }

    onCropChange(
      Math.round(newX * 10) / 10,
      Math.round(newY * 10) / 10,
      Math.round(newWidth * 10) / 10,
      Math.round(newHeight * 10) / 10
    );
  }, [isDragging, activeHandle, dragStart, cropStart, onCropChange]);

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

  /**
   * Render crop overlay
   */
  const renderCropOverlay = () => {
    if (!cropEnabled || !imageBase64) return null;

    const cropStyle = {
      left: `${cropX}%`,
      top: `${cropY}%`,
      width: `${cropWidth}%`,
      height: `${cropHeight}%`
    };

    return (
      <>
        {/* Dimmed overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top */}
          <div 
            className="absolute left-0 right-0 bg-black/50"
            style={{ top: 0, height: `${cropY}%` }}
          />
          {/* Bottom */}
          <div 
            className="absolute left-0 right-0 bg-black/50"
            style={{ top: `${cropY + cropHeight}%`, bottom: 0 }}
          />
          {/* Left */}
          <div 
            className="absolute bg-black/50"
            style={{ 
              top: `${cropY}%`, 
              left: 0, 
              width: `${cropX}%`, 
              height: `${cropHeight}%` 
            }}
          />
          {/* Right */}
          <div 
            className="absolute bg-black/50"
            style={{ 
              top: `${cropY}%`, 
              left: `${cropX + cropWidth}%`, 
              right: 0, 
              height: `${cropHeight}%` 
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
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        预览
      </h2>

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
          className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-8 min-h-[400px] flex items-center justify-center overflow-hidden"
          style={{ userSelect: 'none' }}
        >
          <img
            src={imageBase64}
            alt="Preview"
            className="max-w-full max-h-[600px] object-contain pointer-events-none"
            style={{
              imageRendering: 'crisp-edges'
            }}
            draggable={false}
          />
          {renderCropOverlay()}
        </div>
      )}

      {cropEnabled && imageBase64 && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="font-medium mb-1">裁剪模式已启用</div>
          <div className="text-xs space-y-0.5">
            <div>• 拖动裁剪框移动位置</div>
            <div>• 拖动边角/边缘调整大小</div>
            <div>• 使用左侧滑块精确调整</div>
          </div>
        </div>
      )}
    </div>
  );
};


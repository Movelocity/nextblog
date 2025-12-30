import { useRef, useCallback, useEffect } from 'react';
import { CoordinateTransformer, createCoordinateTransformer } from '../utils/coordinateTransformer';

/**
 * useCoordinateTransformer Hook
 * 
 * 管理坐标转换器实例，自动处理容器和图片尺寸变化
 * 
 * @param containerRef 容器元素引用
 * @param imgRef 图片元素引用
 * @param imageWidth 原图宽度
 * @param imageHeight 原图高度
 * @returns 坐标转换器实例
 */
export const useCoordinateTransformer = (
  containerRef: React.RefObject<HTMLElement | null>,
  imgRef: React.RefObject<HTMLImageElement | null>,
  imageWidth: number | undefined,
  imageHeight: number | undefined
): CoordinateTransformer | null => {
  const transformerRef = useRef<CoordinateTransformer | null>(null);

  /**
   * 更新坐标转换器
   */
  const updateTransformer = useCallback(() => {
    if (!containerRef.current || !imgRef.current || !imageWidth || !imageHeight) {
      transformerRef.current = null;
      return;
    }

    const transformer = createCoordinateTransformer(
      containerRef.current,
      imgRef.current,
      imageWidth,
      imageHeight
    );

    transformerRef.current = transformer;
  }, [containerRef, imgRef, imageWidth, imageHeight]);

  // 初始化和更新转换器
  useEffect(() => {
    updateTransformer();
  }, [updateTransformer]);

  // 监听窗口 resize 事件
  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;

    const handleResize = () => {
      updateTransformer();
    };

    window.addEventListener('resize', handleResize);
    
    // 使用 ResizeObserver 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef?.current);
    if (imgRef.current) {
      resizeObserver.observe(imgRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [containerRef, imgRef, updateTransformer]);

  return transformerRef.current;
};


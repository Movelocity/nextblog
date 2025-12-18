'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiZoomIn, FiZoomOut, FiMaximize2 } from 'react-icons/fi';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
}

const MINIMUM_SCALE = 0.4

export const ImageViewer: React.FC<ImageViewerProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageName,
}) => {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const lastTouchDistance = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset zoom and position when opening
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleWheel = (e: WheelEvent) => {
      if (isOpen) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        
        // Use RAF for smoother updates
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(() => {
          setScale((prev) => Math.min(Math.max(MINIMUM_SCALE, prev + delta), 5));
        });
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = 'unset';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isOpen, onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || e.target === imageRef.current) {
      e.preventDefault();
      setIsDragging(true);
      setHasMoved(false);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    return false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setHasMoved(true);
      
      // Use RAF for smoother dragging
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setHasMoved(false);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    } else if (e.touches.length === 2) {
      // Pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      lastTouchDistance.current = distance;
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      const touch = e.touches[0];
      setHasMoved(true);
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        setPosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        });
      });
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (lastTouchDistance.current > 0) {
        const delta = (distance - lastTouchDistance.current) * 0.01;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(() => {
          setScale((prev) => Math.min(Math.max(MINIMUM_SCALE, prev + delta), 5));
        });
      }
      
      lastTouchDistance.current = distance;
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    lastTouchDistance.current = 0;
  }, []);

  // Double click/tap to zoom
  const handleDoubleClick = useCallback(() => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, MINIMUM_SCALE));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !hasMoved) {
      onClose();
    }
  }, [hasMoved, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default',
        touchAction: 'none',
        overscrollBehavior: 'none',
      }}
    >
      {/* Top toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white text-lg font-medium truncate max-w-[60%]">
          {imageName}
        </h2>
        <button
          onClick={onClose}
          className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
          aria-label="Close viewer"
        >
          <FiX size={24} />
        </button>
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-4 px-6 py-6 bg-gradient-to-t from-black/80 to-transparent">
        <button
          onClick={handleZoomOut}
          className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={scale <= MINIMUM_SCALE}
          aria-label="Zoom out"
        >
          <FiZoomOut size={20} />
        </button>
        
        <div className="text-white/90 font-mono text-sm min-w-[60px] text-center bg-black/40 px-3 py-2 rounded-full">
          {Math.round(scale * 100)}%
        </div>
        
        <button
          onClick={handleZoomIn}
          className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={scale >= 5}
          aria-label="Zoom in"
        >
          <FiZoomIn size={20} />
        </button>
        
        <button
          onClick={handleReset}
          className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-3 transition-all"
          aria-label="Reset zoom and position"
        >
          <FiMaximize2 size={20} />
        </button>
      </div>

      {/* Image */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt={imageName}
        className="select-none pointer-events-none transition-transform duration-200 ease-out"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          userSelect: 'none',
          WebkitUserDrag: 'none',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        } as React.CSSProperties}
        draggable={false}
        onDragStart={handleDragStart}
        onDoubleClick={handleDoubleClick}
      />

      {/* Helper text */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 text-white/60 text-sm bg-black/40 px-4 py-2 rounded-full pointer-events-none">
        Scroll/Pinch to zoom • Drag to move • Double click to reset • ESC to close
      </div>
    </div>,
    document.body
  );
};

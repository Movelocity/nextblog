'use client';

import { useState } from 'react';
import {
  RiPaintBrushLine,
  RiScissorsLine,
  RiCheckLine,
  RiArrowGoBackLine,
} from 'react-icons/ri';
import { useImageProcessorStore, AspectRatioPreset } from '@/app/stores/ImageProcessorStore';
import { CropEditor } from './CropEditor';
import { useToast } from '@/app/components/layout/ToastHook';

const ASPECT_RATIOS: Record<AspectRatioPreset, { ratio: number | null }> = {
  current: { ratio: null },
  '1:1': { ratio: 1 },
  '16:9': { ratio: 16 / 9 },
  '4:3': { ratio: 4 / 3 },
  '3:2': { ratio: 3 / 2 },
  '2:3': { ratio: 2 / 3 },
  '9:16': { ratio: 9 / 16 },
  custom: { ratio: null },
};

/**
 * 图片处理控制组件
 */
export const ImageProcessControls = () => {
  const { showToast } = useToast();
  const [cropLockAspect, setCropLockAspect] = useState(false);
  const [cropAspectPreset, setCropAspectPreset] = useState<AspectRatioPreset>('current');

  const {
    imageState,
    cropEnabled,
    cropApplied,
    cropDraft,
    borderRadius,
    padding,
    backgroundType,
    customBgColor,
    enterCropMode,
    setCropDraft,
    setBorderRadius,
    setPadding,
    setBackgroundType,
    setCustomBgColor,
    resetProcessingParams,
  } = useImageProcessorStore();

  /**
   * 获取裁剪区域的像素尺寸
   */
  const getCropPixelDimensions = () => {
    if (!imageState) return { width: 0, height: 0 };
    const width = Math.round((cropDraft.width / 100) * imageState.width);
    const height = Math.round((cropDraft.height / 100) * imageState.height);
    return { width, height };
  };

  /**
   * 获取应用的裁剪区域像素尺寸
   */
  const getAppliedCropPixelDimensions = () => {
    if (!imageState || !cropApplied) return { width: 0, height: 0 };
    const width = Math.round((cropApplied.width / 100) * imageState.width);
    const height = Math.round((cropApplied.height / 100) * imageState.height);
    return { width, height };
  };

  /**
   * 更新裁剪尺寸（维持宽高比）
   */
  const updateCropDimensions = (
    newWidth?: number,
    newHeight?: number,
    usePreset: AspectRatioPreset = cropAspectPreset
  ) => {
    if (!imageState) return;

    let finalWidthPct =
      newWidth !== undefined ? (newWidth / imageState.width) * 100 : cropDraft.width;
    let finalHeightPct =
      newHeight !== undefined ? (newHeight / imageState.height) * 100 : cropDraft.height;

    if (usePreset === 'current') {
      const ratio = imageState.width / imageState.height;
      if (newWidth !== undefined && cropLockAspect) {
        finalHeightPct = (newWidth / ratio / imageState.height) * 100;
      } else if (newHeight !== undefined && cropLockAspect) {
        finalWidthPct = (newHeight * ratio / imageState.width) * 100;
      }
    } else if (usePreset !== 'custom') {
      const ratio = ASPECT_RATIOS[usePreset].ratio!;
      if (newWidth !== undefined) {
        finalHeightPct = (newWidth / ratio / imageState.height) * 100;
      } else if (newHeight !== undefined) {
        finalWidthPct = (newHeight * ratio / imageState.width) * 100;
      }
    }

    // 确保裁剪不超出边界
    finalWidthPct = Math.min(100, Math.max(1, finalWidthPct));
    finalHeightPct = Math.min(100, Math.max(1, finalHeightPct));

    setCropDraft({
      ...cropDraft,
      width: finalWidthPct,
      height: finalHeightPct,
    });
  };

  /**
   * 处理重置
   */
  const handleReset = () => {
    if (!imageState) return;
    resetProcessingParams();
    showToast('已重置为原图', 'success');
  };

  if (!imageState) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <RiPaintBrushLine className="text-xl" />
        图像处理
      </h2>

      {/* 裁剪 */}
      <div className="mb-4">
        {!cropEnabled ? (
          <div>
            <button
              onClick={enterCropMode}
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RiScissorsLine className="text-lg" />
              {cropApplied ? '调整裁剪' : '开始裁剪'}
            </button>
            {cropApplied && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 rounded p-2">
                <RiCheckLine className="inline mr-1 text-green-600" />
                已应用裁剪: {getAppliedCropPixelDimensions().width} ×{' '}
                {getAppliedCropPixelDimensions().height} px
              </div>
            )}
          </div>
        ) : (
          <CropEditor
            lockAspect={cropLockAspect}
            aspectPreset={cropAspectPreset}
            onLockAspectChange={setCropLockAspect}
            onAspectPresetChange={setCropAspectPreset}
            onDimensionChange={updateCropDimensions}
          />
        )}
      </div>

      {/* 圆角 */}
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

      {/* 边距 */}
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

      {/* 背景 */}
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

      {/* 重置按钮 */}
      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          className="flex-1 py-1.5 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RiArrowGoBackLine />
          重置
        </button>
      </div>
    </div>
  );
};


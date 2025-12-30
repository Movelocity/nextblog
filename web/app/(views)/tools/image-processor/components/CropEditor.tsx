'use client';

import { RiCheckLine } from 'react-icons/ri';
import { useImageProcessorStore, AspectRatioPreset } from '@/app/stores/ImageProcessorStore';
import { useToast } from '@/app/components/layout/ToastHook';

const PRESET_SIZES = [256, 512, 1024];
const ASPECT_RATIOS: Record<AspectRatioPreset, { label: string; ratio: number | null }> = {
  current: { label: '当前比例', ratio: null },
  '1:1': { label: '1:1 (方形)', ratio: 1 },
  '16:9': { label: '16:9 (宽屏)', ratio: 16 / 9 },
  '4:3': { label: '4:3 (标准)', ratio: 4 / 3 },
  '3:2': { label: '3:2 (照片)', ratio: 3 / 2 },
  '2:3': { label: '2:3 (竖版)', ratio: 2 / 3 },
  '9:16': { label: '9:16 (手机)', ratio: 9 / 16 },
  custom: { label: '自定义', ratio: null },
};

interface CropEditorProps {
  lockAspect: boolean;
  aspectPreset: AspectRatioPreset;
  onLockAspectChange: (locked: boolean) => void;
  onAspectPresetChange: (preset: AspectRatioPreset) => void;
  onDimensionChange: (width?: number, height?: number, preset?: AspectRatioPreset) => void;
}

/**
 * 裁剪编辑器组件
 */
export const CropEditor = ({
  lockAspect,
  aspectPreset,
  onLockAspectChange,
  onAspectPresetChange,
  onDimensionChange,
}: CropEditorProps) => {
  const { showToast } = useToast();
  const {
    imageState,
    cropDraft,
    setCropDraft,
    applyCrop,
    cancelCrop,
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
   * 处理应用裁剪
   */
  const handleApply = () => {
    applyCrop();
    showToast('裁剪已应用', 'success');
  };

  /**
   * 处理取消裁剪
   */
  const handleCancel = () => {
    cancelCrop();
    showToast('已取消裁剪', 'info');
  };

  const cropPixelDims = getCropPixelDimensions();

  return (
    <div>
      {/* 比例预设 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          比例预设
        </label>
        <div className="grid grid-cols-3 gap-1 mb-2">
          {(Object.keys(ASPECT_RATIOS) as AspectRatioPreset[]).slice(0, 6).map((preset) => (
            <button
              key={preset}
              onClick={() => {
                onAspectPresetChange(preset);
                if (preset !== 'custom') {
                  onLockAspectChange(true);
                  onDimensionChange(cropPixelDims.width, undefined, preset);
                }
              }}
              className={`py-1 px-2 text-xs rounded border transition-colors ${
                aspectPreset === preset
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              {ASPECT_RATIOS[preset].label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(ASPECT_RATIOS) as AspectRatioPreset[]).slice(6).map((preset) => (
            <button
              key={preset}
              onClick={() => {
                onAspectPresetChange(preset);
                if (preset !== 'custom') {
                  onLockAspectChange(true);
                  onDimensionChange(cropPixelDims.width, undefined, preset);
                }
              }}
              className={`py-1 px-2 text-xs rounded border transition-colors ${
                aspectPreset === preset
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              {ASPECT_RATIOS[preset].label}
            </button>
          ))}
        </div>
      </div>

      {/* 锁定比例 */}
      <label className="flex items-center gap-2 mb-3 text-xs text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={lockAspect}
          onChange={(e) => {
            onLockAspectChange(e.target.checked);
            if (e.target.checked && aspectPreset === 'custom') {
              onAspectPresetChange('current');
            }
          }}
          className="w-3.5 h-3.5 text-blue-600 rounded"
        />
        锁定比例
      </label>

      {/* 尺寸预设 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          尺寸预设
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => {
                if (cropPixelDims.width >= cropPixelDims.height) {
                  onDimensionChange(size, undefined);
                } else {
                  onDimensionChange(undefined, size);
                }
              }}
              className="py-1.5 px-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      {/* 自定义尺寸 */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
          自定义尺寸 (像素)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">宽度</label>
            <input
              type="number"
              min="1"
              max={imageState?.width}
              value={cropPixelDims.width}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) onDimensionChange(val, undefined);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">高度</label>
            <input
              type="number"
              min="1"
              max={imageState?.height}
              value={cropPixelDims.height}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) onDimensionChange(undefined, val);
              }}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 位置滑块 */}
      <div className="space-y-3 mb-3">
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            X 偏移: {cropDraft.x.toFixed(1)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={cropDraft.x}
            onChange={(e) => setCropDraft({ ...cropDraft, x: Number(e.target.value) })}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">
            Y 偏移: {cropDraft.y.toFixed(1)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={cropDraft.y}
            onChange={(e) => setCropDraft({ ...cropDraft, y: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleApply}
          className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 text-sm font-medium"
        >
          <RiCheckLine className="text-lg" />
          应用
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 py-2 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
        >
          取消
        </button>
      </div>
    </div>
  );
};


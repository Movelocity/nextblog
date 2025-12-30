'use client';

import { useState } from 'react';
import { RiDownloadLine, RiFileCopyLine } from 'react-icons/ri';
import {
  useImageProcessorStore,
  ExportFormat,
  AspectRatioPreset,
} from '@/app/stores/ImageProcessorStore';
import { exportImage, copyImageToClipboard } from '../utils/canvasUtils';
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

/**
 * 图片导出控制组件
 */
export const ImageExportControls = () => {
  const { showToast } = useToast();
  const [scaleLockAspect, setScaleLockAspect] = useState(true);
  const [scaleAspectPreset, setScaleAspectPreset] = useState<AspectRatioPreset>('current');

  const {
    imageState,
    canvasRef,
    scaleEnabled,
    scaleWidth,
    scaleHeight,
    scalePercent,
    exportFormat,
    jpgQuality,
    exportSize,
    setScaleEnabled,
    setScaleWidth,
    setScaleHeight,
    setScalePercent,
    setExportFormat,
    setJpgQuality,
  } = useImageProcessorStore();

  /**
   * 获取当前处理后的图片尺寸
   */
  const getCurrentDimensions = () => {
    if (!canvasRef) return { width: 0, height: 0 };
    return { width: canvasRef.width, height: canvasRef.height };
  };

  /**
   * 更新缩放尺寸（维持宽高比）
   */
  const updateScaleDimensions = (
    newWidth?: number,
    newHeight?: number,
    usePreset: AspectRatioPreset = scaleAspectPreset
  ) => {
    const current = getCurrentDimensions();
    if (!current.width || !current.height) return;

    let finalWidth = newWidth ?? scaleWidth;
    let finalHeight = newHeight ?? scaleHeight;

    if (usePreset === 'current') {
      const ratio = current.width / current.height;
      if (newWidth !== undefined && scaleLockAspect) {
        finalHeight = Math.round(newWidth / ratio);
      } else if (newHeight !== undefined && scaleLockAspect) {
        finalWidth = Math.round(newHeight * ratio);
      }
    } else if (usePreset !== 'custom') {
      const ratio = ASPECT_RATIOS[usePreset].ratio!;
      if (newWidth !== undefined) {
        finalHeight = Math.round(newWidth / ratio);
      } else if (newHeight !== undefined) {
        finalWidth = Math.round(newHeight * ratio);
      }
    }

    setScaleWidth(finalWidth);
    setScaleHeight(finalHeight);

    // 更新百分比
    if (current.width > 0) {
      setScalePercent(Math.round((finalWidth / current.width) * 100));
    }
  };

  /**
   * 处理导出
   */
  const handleExport = () => {
    if (!canvasRef) return;

    exportImage(
      canvasRef,
      exportFormat,
      jpgQuality,
      () => showToast('图片导出成功', 'success'),
      (msg) => showToast(msg, 'info')
    );
  };

  /**
   * 处理复制到剪贴板
   */
  const handleCopy = () => {
    if (!canvasRef) return;

    copyImageToClipboard(
      canvasRef,
      () => showToast('已复制到剪贴板', 'success'),
      () => showToast('复制失败', 'error')
    );
  };

  if (!imageState) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <RiDownloadLine className="text-xl" />
        导出设置
      </h2>

      {/* 缩放控制 */}
      <div className="mb-4">
        <label className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={scaleEnabled}
            onChange={(e) => {
              setScaleEnabled(e.target.checked);
              if (e.target.checked) {
                const current = getCurrentDimensions();
                setScaleWidth(current.width);
                setScaleHeight(current.height);
              }
            }}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">启用缩放</span>
        </label>

        {scaleEnabled && (
          <div className="space-y-3 mt-3">
            {/* 比例预设 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                比例预设
              </label>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {(Object.keys(ASPECT_RATIOS) as AspectRatioPreset[]).slice(0, 6).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setScaleAspectPreset(preset);
                      if (preset !== 'custom') {
                        setScaleLockAspect(true);
                        updateScaleDimensions(scaleWidth, undefined, preset);
                      }
                    }}
                    className={`py-1 px-2 text-xs rounded border transition-colors ${
                      scaleAspectPreset === preset
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
                      setScaleAspectPreset(preset);
                      if (preset !== 'custom') {
                        setScaleLockAspect(true);
                        updateScaleDimensions(scaleWidth, undefined, preset);
                      }
                    }}
                    className={`py-1 px-2 text-xs rounded border transition-colors ${
                      scaleAspectPreset === preset
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
            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={scaleLockAspect}
                onChange={(e) => {
                  setScaleLockAspect(e.target.checked);
                  if (e.target.checked && scaleAspectPreset === 'custom') {
                    setScaleAspectPreset('current');
                  }
                }}
                className="w-3.5 h-3.5 text-blue-600 rounded"
              />
              锁定比例
            </label>

            {/* 尺寸预设 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                尺寸预设
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      if (scaleWidth >= scaleHeight) {
                        updateScaleDimensions(size, undefined);
                      } else {
                        updateScaleDimensions(undefined, size);
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
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                自定义尺寸 (像素)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">宽度</label>
                  <input
                    type="number"
                    min="1"
                    max="8192"
                    value={scaleWidth}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) updateScaleDimensions(val, undefined);
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">高度</label>
                  <input
                    type="number"
                    min="1"
                    max="8192"
                    value={scaleHeight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val > 0) updateScaleDimensions(undefined, val);
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* 百分比滑块 */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                缩放比例: {scalePercent}%
              </label>
              <input
                type="range"
                min="1"
                max="400"
                value={scalePercent}
                onChange={(e) => {
                  const percent = Number(e.target.value);
                  setScalePercent(percent);
                  const current = getCurrentDimensions();
                  const newWidth = Math.round((percent / 100) * current.width);
                  const newHeight = Math.round((percent / 100) * current.height);
                  setScaleWidth(newWidth);
                  setScaleHeight(newHeight);
                }}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* 格式选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          格式
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['png', 'jpg', 'webp', 'ico'] as ExportFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => setExportFormat(format)}
              className={`py-1 px-2 rounded-sm border transition-all ${
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

      {/* JPG 质量 */}
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

      {/* 预计大小 */}
      {exportSize && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          预计大小: <span className="font-semibold">{exportSize}</span>
        </div>
      )}

      {/* 导出按钮 */}
      <div className="space-y-2">
        <button
          onClick={handleExport}
          className="w-full py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <RiDownloadLine className="text-xl" />
          下载图片
        </button>
        <button
          onClick={handleCopy}
          className="w-full py-1.5 px-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RiFileCopyLine className="text-lg" />
          复制到剪贴板
        </button>
      </div>
    </div>
  );
};


import { create } from 'zustand';

/**
 * 图片状态接口
 */
export interface ImageState {
  originalBase64: string;
  processedBase64: string;
  width: number;
  height: number;
}

/**
 * 裁剪参数接口
 */
export interface CropParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 背景类型
 */
export type BackgroundType = 'transparent' | 'white' | 'custom';

/**
 * 导出格式
 */
export type ExportFormat = 'png' | 'jpg' | 'webp' | 'ico';

/**
 * 宽高比预设
 */
export type AspectRatioPreset = 'current' | '1:1' | '16:9' | '4:3' | '3:2' | '2:3' | '9:16' | 'custom';

/**
 * 图片处理器 Store 接口
 */
export interface ImageProcessorStore {
  // 图片状态
  imageState: ImageState | null;
  setImageState: (state: ImageState | null) => void;
  updateProcessedBase64: (base64: string) => void;

  // Canvas ref
  canvasRef: HTMLCanvasElement | null;
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;

  // 裁剪状态
  cropEnabled: boolean;
  cropDraft: CropParams;
  cropApplied: CropParams | null;
  setCropEnabled: (enabled: boolean) => void;
  setCropDraft: (crop: CropParams) => void;
  setAppliedCrop: (crop: CropParams | null) => void;
  enterCropMode: () => void;
  applyCrop: () => void;
  cancelCrop: () => void;

  // 编辑参数
  borderRadius: number;
  padding: number;
  backgroundType: BackgroundType;
  customBgColor: string;
  setBorderRadius: (radius: number) => void;
  setPadding: (padding: number) => void;
  setBackgroundType: (type: BackgroundType) => void;
  setCustomBgColor: (color: string) => void;

  // 缩放和导出设置
  scaleEnabled: boolean;
  scaleWidth: number;
  scaleHeight: number;
  scaleLockAspect: boolean;
  scaleAspectPreset: AspectRatioPreset;
  scalePercent: number;
  exportFormat: ExportFormat;
  jpgQuality: number;
  exportSize: string;
  setScaleEnabled: (enabled: boolean) => void;
  setScaleWidth: (width: number) => void;
  setScaleHeight: (height: number) => void;
  setScaleLockAspect: (lock: boolean) => void;
  setScaleAspectPreset: (preset: AspectRatioPreset) => void;
  setScalePercent: (percent: number) => void;
  setExportFormat: (format: ExportFormat) => void;
  setJpgQuality: (quality: number) => void;
  setExportSize: (size: string) => void;

  // URL 输入状态
  urlInput: string;
  isLoadingUrl: boolean;
  setUrlInput: (url: string) => void;
  setIsLoadingUrl: (loading: boolean) => void;

  // 重置方法
  resetProcessingParams: () => void;
  resetAll: () => void;
}

/**
 * 默认裁剪参数
 */
const DEFAULT_CROP: CropParams = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

/**
 * 图片处理器 Store
 */
export const useImageProcessorStore = create<ImageProcessorStore>()((set, get) => ({
  // 图片状态
  imageState: null,
  setImageState: (state) => set({ imageState: state }),
  updateProcessedBase64: (base64) => set((s) => {
    if (!s.imageState) return {};
    return { imageState: { ...s.imageState, processedBase64: base64 } };
  }),

  // Canvas ref
  canvasRef: null,
  setCanvasRef: (ref) => set({ canvasRef: ref }),

  // 裁剪状态
  cropEnabled: false,
  cropDraft: DEFAULT_CROP,
  cropApplied: null,
  setCropEnabled: (enabled) => set({ cropEnabled: enabled }),
  setCropDraft: (crop) => set({ cropDraft: crop }),
  setAppliedCrop: (crop) => set({ cropApplied: crop }),
  
  enterCropMode: () => {
    const { cropApplied } = get();
    set({
      cropEnabled: true,
      cropDraft: cropApplied || DEFAULT_CROP,
    });
  },

  applyCrop: () => {
    const { cropDraft } = get();
    set({
      cropEnabled: false,
      cropApplied: cropDraft,
    });
  },

  cancelCrop: () => {
    const { cropApplied } = get();
    set({
      cropEnabled: false,
      cropDraft: cropApplied || DEFAULT_CROP,
    });
  },

  // 编辑参数
  borderRadius: 0,
  padding: 0,
  backgroundType: 'transparent',
  customBgColor: '#ffffff',
  setBorderRadius: (radius) => set({ borderRadius: radius }),
  setPadding: (padding) => set({ padding: padding }),
  setBackgroundType: (type) => set({ backgroundType: type }),
  setCustomBgColor: (color) => set({ customBgColor: color }),

  // 缩放和导出设置
  scaleEnabled: false,
  scaleWidth: 0,
  scaleHeight: 0,
  scaleLockAspect: true,
  scaleAspectPreset: 'current',
  scalePercent: 100,
  exportFormat: 'png',
  jpgQuality: 92,
  exportSize: '',
  setScaleEnabled: (enabled) => set({ scaleEnabled: enabled }),
  setScaleWidth: (width) => set({ scaleWidth: width }),
  setScaleHeight: (height) => set({ scaleHeight: height }),
  setScaleLockAspect: (lock) => set({ scaleLockAspect: lock }),
  setScaleAspectPreset: (preset) => set({ scaleAspectPreset: preset }),
  setScalePercent: (percent) => set({ scalePercent: percent }),
  setExportFormat: (format) => set({ exportFormat: format }),
  setJpgQuality: (quality) => set({ jpgQuality: quality }),
  setExportSize: (size) => set({ exportSize: size }),

  // URL 输入状态
  urlInput: '',
  isLoadingUrl: false,
  setUrlInput: (url) => set({ urlInput: url }),
  setIsLoadingUrl: (loading) => set({ isLoadingUrl: loading }),

  // 重置方法
  resetProcessingParams: () => set({
    cropEnabled: false,
    cropDraft: DEFAULT_CROP,
    cropApplied: null,
    borderRadius: 0,
    padding: 0,
    backgroundType: 'transparent',
    scaleEnabled: false,
    scalePercent: 100,
    scaleLockAspect: true,
    scaleAspectPreset: 'current',
  }),

  resetAll: () => set({
    imageState: null,
    canvasRef: null,
    cropEnabled: false,
    cropDraft: DEFAULT_CROP,
    cropApplied: null,
    borderRadius: 0,
    padding: 0,
    backgroundType: 'transparent',
    customBgColor: '#ffffff',
    scaleEnabled: false,
    scaleWidth: 0,
    scaleHeight: 0,
    scaleLockAspect: true,
    scaleAspectPreset: 'current',
    scalePercent: 100,
    exportFormat: 'png',
    jpgQuality: 92,
    exportSize: '',
    urlInput: '',
    isLoadingUrl: false,
  }),
}));


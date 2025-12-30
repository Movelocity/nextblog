import { ImageState } from '@/app/stores/ImageProcessorStore';

/**
 * 将文件转换为 base64 字符串
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 从 base64 字符串加载图片
 */
export const loadImageFromBase64 = (base64: string): Promise<ImageState> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        originalBase64: base64,
        processedBase64: base64,
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = reject;
    img.src = base64;
  });
};

/**
 * 生成处理参数的签名，用于避免重复处理
 */
export const createProcessingSignature = (params: {
  crop: { x: number; y: number; width: number; height: number } | null;
  borderRadius: number;
  padding: number;
  backgroundType: string;
  customBgColor: string | null;
}): string => {
  return JSON.stringify({
    crop: params.crop,
    borderRadius: params.borderRadius,
    padding: params.padding,
    backgroundType: params.backgroundType,
    customBgColor: params.backgroundType === 'custom' ? params.customBgColor : null,
  });
};


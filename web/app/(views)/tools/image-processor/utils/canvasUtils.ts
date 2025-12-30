import { ImageState, CropParams, BackgroundType, ExportFormat } from '@/app/stores/ImageProcessorStore';

/**
 * 处理图片参数接口
 */
export interface ProcessImageParams {
  crop: CropParams | null;
  borderRadius: number;
  padding: number;
  backgroundType: BackgroundType;
  customBgColor: string;
}

/**
 * 处理图片到 Canvas
 */
export const processImageToCanvas = (
  canvas: HTMLCanvasElement,
  imageState: ImageState,
  params: ProcessImageParams
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d')!;

      // 计算裁剪尺寸
      let srcX = 0;
      let srcY = 0;
      let srcWidth = img.width;
      let srcHeight = img.height;

      if (params.crop) {
        srcX = (params.crop.x / 100) * img.width;
        srcY = (params.crop.y / 100) * img.height;
        srcWidth = (params.crop.width / 100) * img.width;
        srcHeight = (params.crop.height / 100) * img.height;
      }

      // 计算最终尺寸（包含边距）
      const finalWidth = srcWidth + params.padding * 2;
      const finalHeight = srcHeight + params.padding * 2;

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      // 清空画布
      ctx.clearRect(0, 0, finalWidth, finalHeight);

      // 应用背景
      if (params.backgroundType !== 'transparent') {
        ctx.fillStyle = params.backgroundType === 'white' ? '#ffffff' : params.customBgColor;

        if (params.borderRadius > 0) {
          // 绘制圆角矩形背景
          drawRoundedRect(ctx, 0, 0, finalWidth, finalHeight, params.borderRadius);
          ctx.fill();
        } else {
          ctx.fillRect(0, 0, finalWidth, finalHeight);
        }
      }

      // 应用圆角裁剪
      if (params.borderRadius > 0) {
        ctx.save();
        drawRoundedRect(ctx, 0, 0, finalWidth, finalHeight, params.borderRadius);
        ctx.clip();
      }

      // 绘制图片
      ctx.drawImage(
        img,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        params.padding,
        params.padding,
        srcWidth,
        srcHeight
      );

      if (params.borderRadius > 0) {
        ctx.restore();
      }

      // 返回处理后的 base64
      const processedBase64 = canvas.toDataURL('image/png');
      resolve(processedBase64);
    };

    img.src = imageState.originalBase64;
  });
};

/**
 * 绘制圆角矩形路径
 */
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/**
 * 创建导出用的 Canvas（支持缩放）
 */
export const createExportCanvas = (
  sourceCanvas: HTMLCanvasElement,
  scaleEnabled: boolean,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement => {
  if (!scaleEnabled) {
    return sourceCanvas;
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = targetWidth;
  exportCanvas.height = targetHeight;

  const ctx = exportCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 绘制缩放后的图片
  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  return exportCanvas;
};

/**
 * 计算导出文件大小
 */
export const calculateExportSize = (
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number
): Promise<string> => {
  return new Promise((resolve) => {
    let mimeType = 'image/png';
    let qualityValue = 1.0;

    switch (format) {
      case 'jpg':
        mimeType = 'image/jpeg';
        qualityValue = quality / 100;
        break;
      case 'webp':
        mimeType = 'image/webp';
        qualityValue = 0.92;
        break;
      case 'ico':
        mimeType = 'image/png';
        break;
    }

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const sizeInKB = (blob.size / 1024).toFixed(2);
          const dimensions = `${canvas.width} × ${canvas.height}`;
          resolve(`${dimensions} · ${sizeInKB} KB`);
        } else {
          resolve('');
        }
      },
      mimeType,
      qualityValue
    );
  });
};

/**
 * 导出图片
 */
export const exportImage = (
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number,
  onSuccess: () => void,
  onWarning?: (message: string) => void
) => {
  let mimeType = 'image/png';
  let qualityValue = 1.0;
  let extension = format;

  switch (format) {
    case 'jpg':
      mimeType = 'image/jpeg';
      qualityValue = quality / 100;
      break;
    case 'webp':
      mimeType = 'image/webp';
      qualityValue = 0.92;
      break;
    case 'ico':
      mimeType = 'image/png';
      extension = 'png';
      if (onWarning) {
        onWarning('ICO 格式将导出为 PNG');
      }
      break;
  }

  canvas.toBlob(
    (blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed-image-${Date.now()}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onSuccess();
    },
    mimeType,
    qualityValue
  );
};

/**
 * 复制图片到剪贴板
 */
export const copyImageToClipboard = async (
  canvas: HTMLCanvasElement,
  onSuccess: () => void,
  onError: () => void
) => {
  try {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        onError();
        return;
      }

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      onSuccess();
    });
  } catch (error) {
    onError();
  }
};


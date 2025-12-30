import { CropParams } from '@/app/stores/ImageProcessorStore';

/**
 * 坐标空间定义
 */
export interface CoordinateSpaces {
  /** 容器坐标空间 (包含 padding 的外层容器) */
  container: {
    width: number;
    height: number;
  };
  
  /** 显示坐标空间 (图片实际显示的区域和位置) */
  display: {
    width: number;
    height: number;
    offsetX: number;  // 图片左上角相对容器的 X 偏移
    offsetY: number;  // 图片左上角相对容器的 Y 偏移
  };
  
  /** 原始图片坐标空间 */
  image: {
    width: number;
    height: number;
  };
}

/**
 * 坐标转换器
 * 
 * 职责：管理三个坐标空间（容器、显示、图片）之间的转换
 * 
 * 三个坐标空间：
 * 1. Container Space - 容器尺寸（包含 padding: p-8）
 * 2. Display Space - 图片通过 object-contain 缩放后的实际显示尺寸和位置
 * 3. Image Space - 原始图片的像素尺寸
 */
export class CoordinateTransformer {
  private spaces: CoordinateSpaces;

  constructor(spaces: CoordinateSpaces) {
    this.spaces = spaces;
  }

  /**
   * 更新坐标空间配置
   */
  updateSpaces(spaces: CoordinateSpaces) {
    this.spaces = spaces;
  }

  /**
   * 容器坐标转显示坐标
   * @param containerX 容器坐标 X
   * @param containerY 容器坐标 Y
   * @returns 显示坐标 {x, y}
   */
  containerToDisplay(containerX: number, containerY: number): { x: number; y: number } {
    return {
      x: containerX - this.spaces.display.offsetX,
      y: containerY - this.spaces.display.offsetY,
    };
  }

  /**
   * 显示坐标转容器坐标
   * @param displayX 显示坐标 X
   * @param displayY 显示坐标 Y
   * @returns 容器坐标 {x, y}
   */
  displayToContainer(displayX: number, displayY: number): { x: number; y: number } {
    return {
      x: displayX + this.spaces.display.offsetX,
      y: displayY + this.spaces.display.offsetY,
    };
  }

  /**
   * 显示坐标转图片坐标（百分比）
   * @param displayCrop 显示坐标空间的裁剪参数（像素）
   * @returns 图片坐标空间的裁剪参数（百分比）
   */
  displayToImagePercent(displayCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): CropParams {
    const { display, image } = this.spaces;

    // 计算缩放比例（显示尺寸 -> 原图尺寸）
    const scaleX = image.width / display.width;
    const scaleY = image.height / display.height;

    // 转换为图片坐标（像素）
    const imageX = displayCrop.x * scaleX;
    const imageY = displayCrop.y * scaleY;
    const imageWidth = displayCrop.width * scaleX;
    const imageHeight = displayCrop.height * scaleY;

    // 转换为百分比
    return {
      x: (imageX / image.width) * 100,
      y: (imageY / image.height) * 100,
      width: (imageWidth / image.width) * 100,
      height: (imageHeight / image.height) * 100,
    };
  }

  /**
   * 图片坐标（百分比）转显示坐标（像素）
   * @param imageCrop 图片坐标空间的裁剪参数（百分比）
   * @returns 显示坐标空间的裁剪参数（像素）
   */
  imagePercentToDisplay(imageCrop: CropParams): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { display, image } = this.spaces;

    // 百分比转图片坐标（像素）
    const imageX = (imageCrop.x / 100) * image.width;
    const imageY = (imageCrop.y / 100) * image.height;
    const imageWidth = (imageCrop.width / 100) * image.width;
    const imageHeight = (imageCrop.height / 100) * image.height;

    // 计算缩放比例（原图尺寸 -> 显示尺寸）
    const scaleX = display.width / image.width;
    const scaleY = display.height / image.height;

    // 转换为显示坐标（像素）
    return {
      x: imageX * scaleX,
      y: imageY * scaleY,
      width: imageWidth * scaleX,
      height: imageHeight * scaleY,
    };
  }

  /**
   * 容器坐标（百分比）转图片坐标（百分比）
   * 
   * 注意：这是旧的错误方法，仅用于兼容性参考
   * @deprecated 请使用 containerToDisplay + displayToImagePercent
   */
  containerPercentToImagePercent(containerCrop: CropParams): CropParams {
    // 先转为容器像素
    const containerX = (containerCrop.x / 100) * this.spaces.container.width;
    const containerY = (containerCrop.y / 100) * this.spaces.container.height;
    const containerWidth = (containerCrop.width / 100) * this.spaces.container.width;
    const containerHeight = (containerCrop.height / 100) * this.spaces.container.height;

    // 转为显示坐标
    const display = this.containerToDisplay(containerX, containerY);

    // 转为图片百分比
    return this.displayToImagePercent({
      x: display.x,
      y: display.y,
      width: containerWidth,
      height: containerHeight,
    });
  }

  /**
   * 检查点是否在图片显示区域内
   * @param displayX 显示坐标 X
   * @param displayY 显示坐标 Y
   * @returns 是否在显示区域内
   */
  isPointInDisplayArea(displayX: number, displayY: number): boolean {
    const { display } = this.spaces;
    return (
      displayX >= 0 &&
      displayX <= display.width &&
      displayY >= 0 &&
      displayY <= display.height
    );
  }

  /**
   * 约束显示坐标裁剪框在有效范围内
   * @param displayCrop 显示坐标的裁剪框
   * @returns 约束后的裁剪框
   */
  constrainDisplayCrop(displayCrop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const { display } = this.spaces;
    
    let { x, y, width, height } = displayCrop;

    // 确保最小尺寸（至少 10px）
    const minSize = 10;
    width = Math.max(minSize, width);
    height = Math.max(minSize, height);

    // 约束在显示区域内
    x = Math.max(0, Math.min(display.width - width, x));
    y = Math.max(0, Math.min(display.height - height, y));
    
    // 确保不超出边界
    width = Math.min(display.width - x, width);
    height = Math.min(display.height - y, height);

    return { x, y, width, height };
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(): string {
    const { container, display, image } = this.spaces;
    return `
Container: ${container.width}x${container.height}
Display: ${display.width}x${display.height} @ (${display.offsetX}, ${display.offsetY})
Image: ${image.width}x${image.height}
Scale: ${(display.width / image.width).toFixed(3)}x${(display.height / image.height).toFixed(3)}
    `.trim();
  }
}

/**
 * 计算图片的显示边界
 * 
 * 当图片通过 object-contain 显示时，需要计算实际显示区域
 * @param containerEl 容器元素
 * @param imgEl 图片元素
 * @returns 显示坐标空间信息
 */
export const calculateDisplayBounds = (
  containerEl: HTMLElement,
  imgEl: HTMLImageElement
): CoordinateSpaces['display'] => {
  const containerRect = containerEl.getBoundingClientRect();
  const imgRect = imgEl.getBoundingClientRect();

  // 图片实际显示的尺寸
  const displayWidth = imgRect.width;
  const displayHeight = imgRect.height;

  // 图片相对于容器的偏移（考虑居中）
  const offsetX = imgRect.left - containerRect.left;
  const offsetY = imgRect.top - containerRect.top;

  return {
    width: displayWidth,
    height: displayHeight,
    offsetX,
    offsetY,
  };
};

/**
 * 创建坐标转换器实例
 * @param containerEl 容器元素
 * @param imgEl 图片元素
 * @param imageWidth 原图宽度
 * @param imageHeight 原图高度
 * @returns 坐标转换器实例
 */
export const createCoordinateTransformer = (
  containerEl: HTMLElement,
  imgEl: HTMLImageElement,
  imageWidth: number,
  imageHeight: number
): CoordinateTransformer => {
  const containerRect = containerEl.getBoundingClientRect();
  const display = calculateDisplayBounds(containerEl, imgEl);

  return new CoordinateTransformer({
    container: {
      width: containerRect.width,
      height: containerRect.height,
    },
    display,
    image: {
      width: imageWidth,
      height: imageHeight,
    },
  });
};


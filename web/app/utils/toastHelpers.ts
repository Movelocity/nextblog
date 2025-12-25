/**
 * Toast辅助工具函数
 * 展示如何在非React组件中使用全局toast事件
 */

import { toast } from '@/app/lib/toastEmitter';

/**
 * 处理API响应并显示相应的toast消息
 * @param promise API请求Promise
 * @param successMessage 成功消息
 * @param errorMessage 错误消息（可选）
 */
export const handleApiResponse = async <T>(
  promise: Promise<T>,
  successMessage: string,
  errorMessage?: string
): Promise<T> => {
  try {
    const result = await promise;
    toast.success(successMessage);
    return result;
  } catch (error) {
    const message = errorMessage || '操作失败，请重试';
    toast.error(message);
    throw error;
  }
};

/**
 * 复制文本到剪贴板并显示toast
 * @param text 要复制的文本
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  } catch (error) {
    toast.error('复制失败，请手动复制');
  }
};

/**
 * 表单验证辅助函数
 * @param condition 验证条件
 * @param message 失败时的提示消息
 * @returns 验证是否通过
 */
export const validateWithToast = (condition: boolean, message: string): boolean => {
  if (!condition) {
    toast.warning(message);
    return false;
  }
  return true;
};

/**
 * 批量验证
 * @param validations 验证规则数组
 * @returns 是否全部通过
 */
export const validateAll = (
  validations: Array<{ condition: boolean; message: string }>
): boolean => {
  for (const { condition, message } of validations) {
    if (!validateWithToast(condition, message)) {
      return false;
    }
  }
  return true;
};

/**
 * 文件上传进度提示
 */
export const uploadFileWithToast = async (
  file: File,
  uploadFn: (file: File) => Promise<string>
): Promise<string> => {
  toast.info('正在上传文件...');
  
  try {
    const url = await uploadFn(file);
    toast.success('文件上传成功！');
    return url;
  } catch (error) {
    toast.error('文件上传失败');
    throw error;
  }
};

/**
 * 确认操作（配合dialog使用）
 * @param action 要执行的操作
 * @param successMessage 成功消息
 */
export const confirmAction = async (
  action: () => Promise<void>,
  successMessage: string = '操作成功'
): Promise<void> => {
  try {
    await action();
    toast.success(successMessage);
  } catch (error) {
    toast.error('操作失败');
    throw error;
  }
};

/**
 * 网络状态监听（示例）
 */
export const setupNetworkToast = (): (() => void) => {
  const handleOnline = () => toast.success('网络连接已恢复');
  const handleOffline = () => toast.error('网络连接已断开');

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  return () => {};
};


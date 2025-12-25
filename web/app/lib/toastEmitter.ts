/**
 * 全局Toast事件发射器
 * 用于跨组件通信，可以在任何地方（包括非React组件）触发toast消息
 */

import { ToastType } from '../components/layout/Toast';

export interface ToastEvent {
  message: string;
  type: ToastType;
}

type ToastEventListener = (event: ToastEvent) => void;

class ToastEmitter {
  private listeners: Set<ToastEventListener> = new Set();

  /**
   * 订阅toast事件
   * @param listener 事件监听器
   * @returns 取消订阅的函数
   */
  subscribe(listener: ToastEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 发射toast事件
   * @param message 消息内容
   * @param type 消息类型
   */
  emit(message: string, type: ToastType = 'info'): void {
    const event: ToastEvent = { message, type };
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Toast event listener error:', error);
      }
    });
  }

  /**
   * 显示成功消息
   * @param message 消息内容
   */
  success(message: string): void {
    this.emit(message, 'success');
  }

  /**
   * 显示错误消息
   * @param message 消息内容
   */
  error(message: string): void {
    this.emit(message, 'error');
  }

  /**
   * 显示警告消息
   * @param message 消息内容
   */
  warning(message: string): void {
    this.emit(message, 'warning');
  }

  /**
   * 显示信息消息
   * @param message 消息内容
   */
  info(message: string): void {
    this.emit(message, 'info');
  }
}

// 创建全局单例
const toastEmitter = new ToastEmitter();

export default toastEmitter;

// 导出便捷函数
export const toast = {
  success: (message: string) => toastEmitter.success(message),
  error: (message: string) => toastEmitter.error(message),
  warning: (message: string) => toastEmitter.warning(message),
  info: (message: string) => toastEmitter.info(message),
  show: (message: string, type: ToastType = 'info') => toastEmitter.emit(message, type),
};


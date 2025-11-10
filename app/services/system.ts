import { get } from '@/app/services/utils';

/**
 * 系统状态响应类型
 */
export interface SystemStatus {
  boot_time: number;
  boot_time_formatted: string;
  uptime_seconds: number;
  memory: {
    system: {
      total: number;
      free: number;
      used: number;
      usage_percent: string;
      total_formatted: string;
      free_formatted: string;
      used_formatted: string;
    };
    process: {
      rss: number;
      heap_total: number;
      heap_used: number;
      external: number;
      array_buffers: number;
      rss_formatted: string;
      heap_total_formatted: string;
      heap_used_formatted: string;
      external_formatted: string;
      array_buffers_formatted: string;
    };
  };
  disk: Record<string, number>;
  error?: string;
}

/**
 * 获取系统状态
 * @returns 系统状态信息
 */
export const getSystemStatus = async (): Promise<SystemStatus> => {
  return get<SystemStatus>('/api/system');
};


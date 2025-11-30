import { get, put } from '@/app/services/utils';
import type { SiteConfig } from '@/app/common/types';

/**
 * 健康检查响应类型
 */
export interface HealthCheck {
  status: string;
  time: string;
}

/**
 * 健康检查
 * @returns 健康检查结果
 */
export const getHealth = async (): Promise<HealthCheck> => {
  return get<HealthCheck>('/health');
};

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
  return get<SystemStatus>('/system/status');
};

/**
 * 获取站点配置
 * @returns 站点配置信息
 */
export const getSiteConfig = async (): Promise<SiteConfig> => {
  // Go 后端使用 /config 端点
  interface GoSiteConfig {
    id: number;
    siteName: string;
    siteDescription: string;
    icpInfo: string;
    updatedAt: string;
  }
  
  const response = await get<GoSiteConfig>('/config');
  
  // 适配返回格式（Go 后端字段名与前端一致）
  return {
    siteName: response.siteName,
    siteDescription: response.siteDescription,
    icpInfo: response.icpInfo
  };
};

/**
 * 更新站点配置
 * @param config 站点配置
 * @returns 更新后的站点配置
 */
export const updateSiteConfig = async (config: SiteConfig): Promise<SiteConfig> => {
  // Go 后端使用 PUT /config
  interface GoSiteConfig {
    id: number;
    siteName: string;
    siteDescription: string;
    icpInfo: string;
    updatedAt: string;
  }
  
  const response = await put<GoSiteConfig>('/config', config);
  
  // 适配返回格式
  return {
    siteName: response.siteName,
    siteDescription: response.siteDescription,
    icpInfo: response.icpInfo
  };
};


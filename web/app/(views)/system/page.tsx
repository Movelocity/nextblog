'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSystemStatus, SystemStatus, getSiteConfig, updateSiteConfig } from '@/app/services/system';
import { useAuth } from '@/app/hooks/useAuth';
import { useToast } from '@/app/components/layout/ToastHook';
import { FiServer, FiHardDrive, FiCpu, FiClock, FiRefreshCw, FiSettings, FiSave } from 'react-icons/fi';
import type { SiteConfig } from '@/app/common/types';

/**
 * 格式化运行时长
 * @param seconds 秒数
 * @returns 格式化后的字符串
 */
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  }
  if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟 ${secs}秒`;
  }
  return `${secs}秒`;
};

/**
 * 格式化字节数为人类可读的格式
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/**
 * 进度条组件
 */
const ProgressBar = ({ 
  value, 
  max, 
  label, 
  color = 'blue' 
}: { 
  value: number; 
  max: number; 
  label: string;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${colorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

/**
 * 信息卡片组件
 */
const InfoCard = ({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: typeof FiServer; 
  children: React.ReactNode;
}) => {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-card">
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

/**
 * 统计项组件
 */
const StatItem = ({ 
  label, 
  value, 
  subValue 
}: { 
  label: string; 
  value: string; 
  subValue?: string;
}) => {
  return (
    <div className="flex justify-between items-start py-2 border-b border-card last:border-0">
      <span className="text-gray-600 dark:text-gray-400 text-sm">{label}</span>
      <div className="text-right">
        <div className="font-semibold text-gray-900 dark:text-gray-100">
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default function SystemPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({ icpInfo: '', siteName: '', siteDescription: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingSiteConfig, setSavingSiteConfig] = useState(false);
  const { isAuthenticated, isLoading, openLoginModal } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    document.title = '系统状态';
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      openLoginModal();
    }
  }, [isLoading, isAuthenticated, openLoginModal]);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const status = await getSystemStatus();
      setSystemStatus(status);
    } catch (error) {
      console.error('Error fetching system status:', error);
      showToast('获取系统状态失败', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const fetchSiteConfig = useCallback(async () => {
    try {
      const config = await getSiteConfig();
      setSiteConfig(config);
    } catch (error) {
      console.error('Error fetching site config:', error);
      showToast('获取站点配置失败', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSystemStatus();
      fetchSiteConfig();
    }
  }, [isAuthenticated, fetchSystemStatus, fetchSiteConfig]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSystemStatus();
  };

  /**
   * 保存站点配置
   */
  const handleSaveSiteConfig = async () => {
    setSavingSiteConfig(true);
    try {
      await updateSiteConfig(siteConfig);
      showToast('站点配置已保存', 'success');
    } catch (error) {
      console.error('Error saving site config:', error);
      showToast('保存站点配置失败', 'error');
    } finally {
      setSavingSiteConfig(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <button 
          className="text-gray-300" 
          onClick={() => openLoginModal()}
        >
          LOGIN
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!systemStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
        <p className="text-gray-600 dark:text-gray-400">无法加载系统状态</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  const { memory, disk, boot_time_formatted, uptime_seconds } = systemStatus;
  const diskSorted = Object.entries(disk).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 页面标题和刷新按钮 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          系统管理
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </button>
      </div>

      {/* 站点配置 */}
      <InfoCard title="站点配置" icon={FiSettings}>
        <div className="space-y-4">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              站点名称
            </label>
            <input
              id="siteName"
              type="text"
              value={siteConfig.siteName || ''}
              onChange={(e) => setSiteConfig({ ...siteConfig, siteName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Next Blog"
            />
          </div>
          
          <div>
            <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              站点描述
            </label>
            <input
              id="siteDescription"
              type="text"
              value={siteConfig.siteDescription || ''}
              onChange={(e) => setSiteConfig({ ...siteConfig, siteDescription: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="A modern blog management system"
            />
          </div>
          
          <div>
            <label htmlFor="icpInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ICP 备案信息
            </label>
            <input
              id="icpInfo"
              type="text"
              value={siteConfig.icpInfo || ''}
              onChange={(e) => setSiteConfig({ ...siteConfig, icpInfo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="粤ICP备xxx号-1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              修改后刷新页面即可生效，无需重启服务
            </p>
          </div>

          <button
            onClick={handleSaveSiteConfig}
            disabled={savingSiteConfig}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className={`w-4 h-4 ${savingSiteConfig ? 'animate-pulse' : ''}`} />
            <span>{savingSiteConfig ? '保存中...' : '保存配置'}</span>
          </button>
        </div>
      </InfoCard>

      {/* 系统信息概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg shadow-sm p-6 border border-card">
          <div className="flex items-center gap-3 mb-2">
            <FiClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              启动时间
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {new Date(boot_time_formatted).toLocaleString('zh-CN')}
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-sm p-6 border border-card">
          <div className="flex items-center gap-3 mb-2">
            <FiClock className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              运行时长
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {formatUptime(uptime_seconds)}
          </p>
        </div>
      </div>

      {/* 磁盘使用情况 */}
      <InfoCard title="磁盘使用" icon={FiHardDrive}>
        <div className="space-y-3">
          {diskSorted.map(([key, bytes]) => {
            const totalDisk = disk.total || 1;
            const percentage = (bytes / totalDisk) * 100;
            
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {key === 'total' ? '总计' : key === 'blogs' ? '博客' : key === 'images' ? '图片' : key === 'thumbnails' ? '缩略图' : key === 'notes' ? '笔记' : key === 'image-edit' ? '图片编辑' : key}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatBytes(bytes)}
                  </span>
                </div>
                {key === 'total' ? null : (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </InfoCard>

      {/* 进程内存 */}
      <InfoCard title="进程内存" icon={FiCpu}>
        <ProgressBar
          value={memory.process.heap_used}
          max={memory.process.heap_total}
          label={`堆内存使用 ${memory.process.heap_used_formatted} / ${memory.process.heap_total_formatted}`}
          color={memory.process.heap_total > 0 && (memory.process.heap_used / memory.process.heap_total) > 0.8 ? 'yellow' : 'blue'}
        />
        <StatItem label="RSS (物理内存)" value={memory.process.rss_formatted} />
        <StatItem label="堆内存总量" value={memory.process.heap_total_formatted} />
        <StatItem label="堆内存已用" value={memory.process.heap_used_formatted} />
        <StatItem label="External" value={memory.process.external_formatted} />
        <StatItem label="ArrayBuffers" value={memory.process.array_buffers_formatted} />
      </InfoCard>

      {/* 系统内存 */}
      <InfoCard title="系统内存" icon={FiServer}>
        <ProgressBar
          value={memory.system.used}
          max={memory.system.total}
          label={`已使用 ${memory.system.used_formatted} / ${memory.system.total_formatted}`}
          color={parseFloat(memory.system.usage_percent) > 80 ? 'red' : parseFloat(memory.system.usage_percent) > 60 ? 'yellow' : 'green'}
        />
        <StatItem label="总内存" value={memory.system.total_formatted} />
        <StatItem label="已使用" value={memory.system.used_formatted} />
        <StatItem label="可用" value={memory.system.free_formatted} />
        <StatItem label="使用率" value={`${memory.system.usage_percent}%`} />
      </InfoCard>
    </div>
  );
}


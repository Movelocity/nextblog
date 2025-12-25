'use client';

import { useState, useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { FiTag, FiCalendar, FiFilter, FiChevronLeft, FiChevronRight, FiArchive } from 'react-icons/fi';
import { useAuth } from '@/app/hooks/useAuth';
import cn from 'classnames';
import { getStats } from '@/app/services/notes';

interface NoteSidebarProps {
  /** 当前选中的标签 */
  selectedTag?: string;
  /** 是否只显示公开笔记 */
  showPublicOnly: boolean;
  /** 是否显示已归档笔记 */
  showArchivedOnly: boolean;
  /** 选择标签回调 */
  onSelectTag: (tag: string | undefined) => void;
  /** 切换公开过滤回调 */
  onTogglePublicFilter: () => void;
  /** 切换归档过滤回调 */
  onToggleArchivedFilter: () => void;
}

type TagStats = Record<string, number>;
type DateStats = Record<string, number>;

/**
 * 笔记侧边栏组件
 * 显示日历和标签统计
 */
const NoteSidebar = ({ 
  selectedTag, 
  showPublicOnly,
  showArchivedOnly,
  onSelectTag, 
  onTogglePublicFilter,
  onToggleArchivedFilter
}: NoteSidebarProps) => {
  const [tagStats, setTagStats] = useState<TagStats>({});
  const [dateStats, setDateStats] = useState<DateStats>({});
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const { isAuthenticated } = useAuth(); 
  

  /**
   * 加载统计数据
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        // 使用新的 API 获取指定月份的统计数据
        const stats = await getStats(currentYear, currentMonth);
        setDateStats(stats);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // 定期刷新统计
    // const interval = setInterval(loadStats, 30000); // 30秒刷新一次
    
    // return () => clearInterval(interval);
  }, [currentYear, currentMonth]);

  /**
   * 获取当前月份的日期列表
   */
  const getCurrentMonthDates = () => {
    const year = currentYear;
    const month = currentMonth - 1; // Date 对象中月份是 0-11
    const now = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const dates = [];
    const startPadding = firstDay.getDay();
    
    for (let i = 0; i < startPadding; i++) {
      dates.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      // 直接构造日期字符串，避免时区转换
      const dateStr = `${year}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dates.push({
        day,
        date: dateStr,
        count: dateStats[dateStr] || 0,
        isToday: day === now.getDate() && currentMonth === now.getMonth() + 1 && year === now.getFullYear(),
      });
    }
    return dates;
  };

  /**
   * 切换到上个月
   */
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  /**
   * 切换到下个月
   */
  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  /**
   * 跳转到当前月份
   */
  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  };

  const monthDates = getCurrentMonthDates();
  const sortedTags = Object.entries(tagStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="w-1/2 lg:w-[260px] h-screen">
      <div className="w-full lg:w-[260px] lg:fixed space-y-6 top-10">
        {/* 日历 */}
        <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {currentYear}年{currentMonth}月
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="上个月"
              >
                <FiChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={goToCurrentMonth}
                className="px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                title="返回今天"
              >
                今
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="下个月"
              >
                <FiChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              加载中...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* 星期标题 */}
              {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
                >
                  {day}
                </div>
              ))}
              
              {/* 日期格子 */}
              {monthDates.map((dateInfo, index) => (
                <div
                  key={index}
                  className={classNames(
                    'aspect-square flex items-center justify-center text-xs rounded cursor-default',
                    dateInfo ? 'relative' : '',
                    dateInfo?.isToday && 'bg-blue-100 dark:bg-blue-900/60 font-bold',
                    (dateInfo?.count ?? 0) > 0 && !dateInfo?.isToday && 'bg-green-100 dark:bg-green-900/60',
                    !dateInfo && 'text-transparent'
                  )}
                  title={dateInfo ? `${dateInfo.date}: ${dateInfo.count ?? 0} 条笔记` : ''}
                >
                  {dateInfo ? (
                    <>
                      <span className={classNames(
                        dateInfo.isToday ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                      )}>
                        {dateInfo.day}
                      </span>
                      {/* {dateInfo.count > 0 && (
                        <span className="absolute bottom-0 right-0 w-1 h-1 bg-green-600 dark:bg-green-400 rounded-full"></span>
                      )} */}
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 过滤器 */}
        <div className={cn("rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 space-y-2", !isAuthenticated && "hidden")}>
          <div className="flex items-center gap-2">
            <FiFilter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">过滤</h3>
          </div>
          
          <button
            onClick={onTogglePublicFilter}
            className={classNames(
              'w-full px-3 py-2 rounded-lg text-sm transition-colors text-left border border-gray-200 dark:border-gray-800',
              showPublicOnly
                ? 'text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {showPublicOnly ? '✓ ' : ''}仅显示公开笔记
          </button>

          <button
            onClick={onToggleArchivedFilter}
            className={classNames(
              'w-full px-3 py-2 rounded-lg text-sm transition-colors text-left border border-gray-200 dark:border-gray-800 flex items-center gap-2',
              showArchivedOnly
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-700 dark:text-gray-300'
            )}
          >
            <FiArchive className="w-4 h-4" />
            {showArchivedOnly ? '✓ ' : ''}查看已归档笔记
          </button>

          <h3 className="font-semibold text-gray-900 dark:text-white">标签</h3>

          {loading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              加载中...
            </div>
          ) : sortedTags.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              还没有标签
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* 全部选项 */}
              <button
                onClick={() => onSelectTag(undefined)}
                className={classNames(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                  !selectedTag
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                )}
              >
                <span>全部</span>
                <span className="text-xs opacity-75">
                  {Object.values(tagStats).reduce((sum, count) => sum + count, 0)}
                </span>
              </button>

              {/* 标签列表 */}
              {sortedTags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className={classNames(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                    selectedTag === tag
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                >
                  <span className="truncate">#{tag}</span>
                  <span className="text-xs opacity-75 ml-2">{count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default NoteSidebar;


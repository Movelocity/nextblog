'use client';

import { useState, useEffect } from 'react';
import classNames from 'classnames';
import { FiTag, FiCalendar, FiFilter } from 'react-icons/fi';

interface NoteSidebarProps {
  /** 当前选中的标签 */
  selectedTag?: string;
  /** 是否只显示公开笔记 */
  showPublicOnly: boolean;
  /** 选择标签回调 */
  onSelectTag: (tag: string | undefined) => void;
  /** 切换公开过滤回调 */
  onTogglePublicFilter: () => void;
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
  onSelectTag, 
  onTogglePublicFilter 
}: NoteSidebarProps) => {
  const [tagStats, setTagStats] = useState<TagStats>({});
  const [dateStats, setDateStats] = useState<DateStats>({});
  const [loading, setLoading] = useState(true);

  /**
   * 加载统计数据
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        // 获取索引数据
        const response = await fetch('/api/notes/stats');
        if (response.ok) {
          const data = await response.json();
          setTagStats(data.tagged || {});
          
          // 计算日期统计
          const dates: DateStats = {};
          Object.keys(data.files || {}).forEach(dateFile => {
            const date = dateFile.replace('.json', '');
            dates[date] = data.files[dateFile].length;
          });
          setDateStats(dates);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // 定期刷新统计
    const interval = setInterval(loadStats, 30000); // 30秒刷新一次
    
    return () => clearInterval(interval);
  }, []);

  /**
   * 获取当前月份的日期列表
   */
  const getCurrentMonthDates = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const dates = [];
    const startPadding = firstDay.getDay();
    
    for (let i = 0; i < startPadding; i++) {
      dates.push(null);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      // 直接构造日期字符串，避免时区转换
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dates.push({
        day,
        date: dateStr,
        count: dateStats[dateStr] || 0,
        isToday: day === now.getDate() && month === now.getMonth() && year === now.getFullYear(),
      });
    }
    return dates;
  };

  const monthDates = getCurrentMonthDates();
  const sortedTags = Object.entries(tagStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="w-[200px] space-y-6">
      {/* 过滤器 */}
      <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiFilter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">过滤器</h3>
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
      </div>

      {/* 日历 */}
      <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiCalendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
          </h3>
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
                  dateInfo?.isToday && 'bg-blue-100 dark:bg-blue-900/30 font-bold',
                  (dateInfo?.count ?? 0) > 0 && !dateInfo?.isToday && 'bg-green-100 dark:bg-green-900/30',
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

      {/* 标签统计 */}
      <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FiTag className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">标签</h3>
        </div>

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
  );
};

export default NoteSidebar;


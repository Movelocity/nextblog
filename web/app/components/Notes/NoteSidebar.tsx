'use client';

import { useState, useEffect } from 'react';
import classNames from 'classnames';
import { FiCalendar, FiFilter, FiChevronLeft, FiChevronRight, FiArchive, FiSearch } from 'react-icons/fi';
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
  /** 搜索回调 */
  onSearch: (keyword: string) => void;
  /** 当前搜索关键词 */
  searchKeyword?: string;
  /** 选择日期回调 */
  onSelectDate: (date: string | undefined) => void;
  /** 当前选中的日期 */
  selectedDate?: string;
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
  onToggleArchivedFilter,
  onSearch,
  searchKeyword = '',
  onSelectDate,
  selectedDate
}: NoteSidebarProps) => {
  const [tagStats, setTagStats] = useState<TagStats>({});
  const [dateStats, setDateStats] = useState<DateStats>({});
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [keyword, setKeyword] = useState(searchKeyword);
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

  /**
   * 处理日期点击
   */
  const handleDateClick = (date: string, count: number) => {
    if (count === 0) return; // 如果当日没有笔记，不响应点击
    
    if (selectedDate === date) {
      // 再次点击取消日期限定
      onSelectDate(undefined);
    } else {
      // 点击选择日期
      onSelectDate(date);
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    onSearch(keyword.trim());
  };

  /**
   * 处理搜索输入框回车键
   */
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * 同步外部搜索关键词
   */
  useEffect(() => {
    setKeyword(searchKeyword);
  }, [searchKeyword]);

  const monthDates = getCurrentMonthDates();
  const sortedTags = Object.entries(tagStats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="w-1/2 lg:w-[240px] h-screen">
      <div className="w-full lg:w-[240px] lg:fixed space-y-3 top-10">

        {/* 日历 */}
        <div className="rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <FiCalendar className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {currentYear}年{currentMonth}月
              </h3>
            </div>
            <div className="flex items-center">
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

          <div className={classNames(
            "grid grid-cols-7 gap-0.5 transition-opacity duration-200",
            loading && "opacity-50 pointer-events-none"
          )}>
            {/* 星期标题 */}
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div
                key={day}
                className="text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 py-0.5"
              >
                {day}
              </div>
            ))}
            
            {/* 日期格子 */}
            {monthDates.map((dateInfo, index) => {
              const isSelected = dateInfo && selectedDate === dateInfo.date;
              const hasNotes = (dateInfo?.count ?? 0) > 0;
              
              return (
                <div
                  key={index}
                  onClick={() => dateInfo && hasNotes && !loading && handleDateClick(dateInfo.date, dateInfo.count)}
                  className={classNames(
                    'aspect-square flex items-center justify-center text-xs rounded-md transition-colors',
                    dateInfo ? 'relative' : '',
                    isSelected && 'ring-1 ring-blue-600 dark:ring-blue-400',
                    !isSelected && dateInfo?.isToday && 'bg-blue-50 dark:bg-blue-900/50',
                    !isSelected && hasNotes && !dateInfo?.isToday && 'bg-green-200 dark:bg-green-900/50',
                    hasNotes && !loading && 'cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/80',
                    (!hasNotes || loading) && 'cursor-default',
                    !dateInfo && 'text-transparent'
                  )}
                  title={dateInfo ? `${dateInfo.date}: ${dateInfo.count ?? 0} 条笔记` : ''}
                >
                  {dateInfo ? (
                    <span className={classNames(
                      'text-[11px]',
                      isSelected ? 'font-semibold text-blue-700 dark:text-blue-300' :
                      dateInfo.isToday ? 'font-medium text-blue-600 dark:text-blue-400' : 
                      'text-gray-600 dark:text-gray-400'
                    )}>
                      {dateInfo.day}
                    </span>
                  ) : (
                    '-'
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 过滤器 */}
        <div className={cn("rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-3 space-y-2", !isAuthenticated && "hidden")}>
          <div className="flex items-center gap-1.5">
            <FiFilter className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">过滤</h3>
          </div>
          
          <button
            onClick={onTogglePublicFilter}
            className={classNames(
              'w-full px-3 py-2 rounded-md text-sm transition-colors text-left border border-gray-200 dark:border-gray-700',
              showPublicOnly
                ? 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            {showPublicOnly ? '✓ ' : ''}仅显示公开笔记
          </button>

          <button
            onClick={onToggleArchivedFilter}
            className={classNames(
              'w-full px-3 py-2 rounded-md text-sm transition-colors text-left border border-gray-200 dark:border-gray-700 flex items-center gap-1.5',
              showArchivedOnly
                ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <FiArchive className="w-3 h-3" />
            {showArchivedOnly ? '✓ ' : ''}查看已归档笔记
          </button>

          <div className="flex gap-1.5">
            {/* */}
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="输入关键词..."
              className="block flex-1 px-3 py-2 rounded-md text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              className="py-2 px-3 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <FiSearch className="w-4 h-4" />
            </button>
          </div>
          {searchKeyword && (
            <div className="text-[11px] text-gray-600 dark:text-gray-400">
              搜索: {searchKeyword}
              <button
                onClick={() => onSearch('')}
                className="ml-1.5 text-blue-600 dark:text-blue-400 hover:underline"
              >
                清除
              </button>
            </div>
          )}
          {selectedDate && (
            <div className="text-[11px] text-gray-600 dark:text-gray-400">
              日期: {selectedDate}
              <button
                onClick={() => onSelectDate(undefined)}
                className="ml-1.5 text-blue-600 dark:text-blue-400 hover:underline"
              >
                清除
              </button>
            </div>
          )}

          <h3 className="text-sm font-medium text-gray-900 dark:text-white pt-1">标签</h3>

          {sortedTags.length === 0 ? (
            <div className="text-center py-3 text-gray-500 dark:text-gray-400 text-xs">
              {loading ? '加载中...' : '还没有标签'}
            </div>
          ) : (
            <div className={classNames(
              "space-y-1 max-h-48 overflow-y-auto transition-opacity duration-200",
              loading && "opacity-50 pointer-events-none"
            )}>
              {/* 全部选项 */}
              <button
                onClick={() => onSelectTag(undefined)}
                className={classNames(
                  'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors',
                  !selectedTag
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                )}
              >
                <span>全部</span>
                <span className="text-[11px] opacity-75">
                  {Object.values(tagStats).reduce((sum, count) => sum + count, 0)}
                </span>
              </button>

              {/* 标签列表 */}
              {sortedTags.map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className={classNames(
                    'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors',
                    selectedTag === tag
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  )}
                >
                  <span className="truncate">#{tag}</span>
                  <span className="text-[11px] opacity-75 ml-1.5">{count}</span>
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


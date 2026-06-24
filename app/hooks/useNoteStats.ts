'use client';

import { useState, useEffect } from 'react';
import type { NoteIndex } from '@/app/common/types.notes';

type TagStats = Record<string, number>;
type DateStats = Record<string, number>;

export interface NoteStatsResult {
  /** 标签 -> 笔记数量 */
  tagStats: TagStats;
  /** 日期(YYYY-MM-DD) -> 笔记数量 */
  dateStats: DateStats;
  /** 是否加载中 */
  loading: boolean;
  /** 手动触发刷新 */
  refresh: () => void;
}

/**
 * 笔记统计 hook
 * 加载 /api/notes/stats（走 services/utils 的 fetch 封装，自动携带 auth header），
 * 返回标签计数和日期分布，并每 30 秒自动刷新一次。
 *
 * 替代了原先散落在 NoteSidebar 里的直接 fetch 逻辑，供 Sidebar 与 MobileFilter 复用。
 */
export const useNoteStats = (): NoteStatsResult => {
  const [tagStats, setTagStats] = useState<TagStats>({});
  const [dateStats, setDateStats] = useState<DateStats>({});
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;

    const loadStats = async () => {
      try {
        const response = await fetch('/api/notes/stats');
        if (!active || !response.ok) return;
        const data: NoteIndex = await response.json();

        setTagStats(data.tagged || {});

        // index.files 的 key 形如 "2024-01-01.json"，统计每个日期的笔记数
        const dates: DateStats = {};
        Object.keys(data.files || {}).forEach(dateFile => {
          const date = dateFile.replace('.json', '');
          dates[date] = data.files[dateFile].length;
        });
        setDateStats(dates);
      } catch (error) {
        console.error('Failed to load notes stats:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadStats();

    // 定期刷新统计（30秒）
    const interval = setInterval(loadStats, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshTick]);

  const refresh = () => setRefreshTick(t => t + 1);

  return { tagStats, dateStats, loading, refresh };
};

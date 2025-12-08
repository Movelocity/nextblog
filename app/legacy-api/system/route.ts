import { NextResponse } from "next/server";
import { 
  BOOT_TIME_UTC, 
  getSystemMemory, 
  getProcessMemory, 
  getDiskUsage,
  formatBytes 
} from "./utils";

/**
 * GET 请求处理 - 获取服务器系统状态
 * 返回包括内存使用情况和磁盘占用情况在内的完整系统状态
 */
export async function GET() {
  try {
    const systemMemory = getSystemMemory();
    const processMemory = getProcessMemory();
    const diskUsage = await getDiskUsage();

    return NextResponse.json({
      boot_time: BOOT_TIME_UTC,
      boot_time_formatted: new Date(BOOT_TIME_UTC).toISOString(),
      uptime_seconds: Math.floor((Date.now() - BOOT_TIME_UTC) / 1000),
      memory: {
        system: {
          ...systemMemory,
          total_formatted: formatBytes(systemMemory.total),
          free_formatted: formatBytes(systemMemory.free),
          used_formatted: formatBytes(systemMemory.used),
        },
        process: {
          ...processMemory,
          rss_formatted: formatBytes(processMemory.rss),
          heap_total_formatted: formatBytes(processMemory.heap_total),
          heap_used_formatted: formatBytes(processMemory.heap_used),
          external_formatted: formatBytes(processMemory.external),
          array_buffers_formatted: formatBytes(processMemory.array_buffers),
        },
      },
      disk: diskUsage,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        boot_time: BOOT_TIME_UTC,
      },
      { status: 500 }
    );
  }
}
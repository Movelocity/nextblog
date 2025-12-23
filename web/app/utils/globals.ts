type RuntimeConfig = Record<string, string>;

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

const globals = {
  /**
   * 获取运行时注入的 API_BASE_URL；优先从浏览器 runtime config，其次使用服务器进程环境变量
   */
  get API_BASE_URL(): string {
    if (typeof window !== "undefined") {
      return window.__RUNTIME_CONFIG__?.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
    }
    return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  },
};

/**
 * 读取运行时注入的 API_BASE_URL；如缺失则抛错提醒运维配置
 */
export const ensureApiBaseUrl = (): string => {
  const apiBaseUrl = globals.API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("API_BASE_URL 未配置，请在容器启动时注入环境变量");
  }
  return apiBaseUrl;
};

export default globals;

export type Theme = "light" | "dark";
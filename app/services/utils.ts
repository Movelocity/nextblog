
export async function copyToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
    // showToast("Copied to clipboard");
  } catch (error) { // eslint-disable-line no-unused-vars
    // showToast("Failed to copy to clipboard");
  }
  document.body.removeChild(textArea);
}

/**
 * Calculates the estimated reading time in minutes for a given text
 * @param text The text to calculate reading time for
 * @param wordsPerMinute Average reading speed (default: 200 words per minute)
 * @returns Estimated reading time in minutes (rounded up)
 */
export const calculateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

/**
 * Gets a cookie value by name
 * @param name Cookie name
 * @returns Cookie value or null if not found
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
};

// API相关类型定义
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
}

/**
 * API错误类
 */
export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public response?: Response;

  constructor(message: string, status: number, statusText: string, response?: Response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

/**
 * 获取认证token (优先使用cookie中的auth-token，回退到localStorage)
 * @returns 认证token或null
 */
const getAuthToken = (): string | null => {
  // 优先使用cookie中的auth-token
  const cookieToken = getCookie('auth-token');
  if (cookieToken) {
    return cookieToken;
  }
  
  // 回退到localStorage (兼容旧版本)
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  
  return null;
};

/**
 * 处理API响应和错误解析
 * @param response Fetch响应对象
 * @returns 解析后的JSON数据或抛出错误
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // 如果不是JSON，使用文本作为错误消息
      errorMessage = errorText || errorMessage;
    }
    
    throw new ApiError(errorMessage, response.status, response.statusText, response);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  // 对于非JSON响应，返回响应对象本身
  return response as unknown as T;
};

/**
 * 构建URL查询参数
 * @param params 参数对象
 * @returns URLSearchParams对象
 */
const buildSearchParams = (params: Record<string, any>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value) || typeof value === 'object') {
        searchParams.set(key, JSON.stringify(value));
      } else {
        searchParams.set(key, value.toString());
      }
    }
  });
  
  return searchParams;
};

/**
 * 通用的基础fetch函数，自动处理认证、错误和超时
 * @param url 请求URL
 * @param options 请求选项
 * @returns Promise with parsed response
 */
export const baseFetch = async <T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> => {
  const {
    body,
    params,
    timeout = 30000,
    headers = {},
    ...restOptions
  } = options;

  // 构建完整URL
  let fullUrl = url;
  if (params) {
    const searchParams = buildSearchParams(params);
    const separator = url.includes('?') ? '&' : '?';
    fullUrl = `${url}${separator}${searchParams.toString()}`;
  }

  // 准备headers
  const token = getAuthToken();
  const requestHeaders: Record<string, string> = {
    ...(typeof headers === 'object' && headers !== null && !(headers instanceof Headers) ? headers as Record<string, string> : {}),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  // 处理body
  let requestBody: string | FormData | undefined;
  if (body) {
    if (body instanceof FormData) {
      requestBody = body;
      // FormData会自动设置Content-Type，不需要手动设置
    } else {
      requestBody = JSON.stringify(body);
      requestHeaders['Content-Type'] = 'application/json';
    }
  }

  // 创建AbortController用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return await handleResponse<T>(response);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
};

/**
 * GET请求
 * @param url 请求URL
 * @param options 请求选项
 * @returns Promise with parsed response
 */
export const get = <T = any>(url: string, options: Omit<FetchOptions, 'method'> = {}): Promise<T> => {
  return baseFetch<T>(url, { ...options, method: 'GET' });
};

/**
 * POST请求
 * @param url 请求URL
 * @param body 请求体
 * @param options 请求选项
 * @returns Promise with parsed response
 */
export const post = <T = any>(url: string, body?: any, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<T> => {
  return baseFetch<T>(url, { ...options, method: 'POST', body });
};

/**
 * PUT请求
 * @param url 请求URL
 * @param body 请求体
 * @param options 请求选项
 * @returns Promise with parsed response
 */
export const put = <T = any>(url: string, body?: any, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<T> => {
  return baseFetch<T>(url, { ...options, method: 'PUT', body });
};

/**
 * DELETE请求
 * @param url 请求URL
 * @param options 请求选项
 * @returns Promise with parsed response
 */
export const del = <T = any>(url: string, options: Omit<FetchOptions, 'method'> = {}): Promise<T> => {
  return baseFetch<T>(url, { ...options, method: 'DELETE' });
};

// HTTP客户端对象，提供更清晰的API
export const httpClient = {
  get,
  post,
  put,
  del,
  baseFetch,
};

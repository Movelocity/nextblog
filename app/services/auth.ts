import { post, get, getCookie } from './utils';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface AuthCheckResponse {
  valid: boolean;
  user?: {
    email: string;
  };
  error?: string;
}

/**
 * 用户登录
 * @param credentials 登录凭据
 * @returns 登录响应或null
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  return post<LoginResponse>('/api/auth/login', credentials);
};

/**
 * 设置认证token到localStorage (兼容旧版本)
 * @param token 认证token
 */
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
};

/**
 * 获取认证token (优先从cookie，回退到localStorage)
 * @returns 认证token或null
 */
export const getAuthToken = (): string | null => {
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
 * 移除认证token
 */
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  // 也可以尝试清除cookie (需要后端配合)
  if (typeof document !== 'undefined') {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
};

/**
 * 检查用户是否已认证
 * @returns 是否已认证
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  try {
    const data = await get<AuthCheckResponse>('/api/auth/check');
    
    if (!data.valid) {
      removeAuthToken(); // Clear invalid token
      return false;
    }

    return true;
  } catch (error) {
    removeAuthToken(); // Clear token on error
    return false;
  }
}; 
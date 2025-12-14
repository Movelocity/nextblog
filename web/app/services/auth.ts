import { post, get, getCookie } from './utils';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCheckResponse {
  valid: boolean;
  user?: UserInfo;
  error?: string;
}

export interface RegistrationStatusResponse {
  allowed: boolean;
}

/**
 * 用户注册
 * @param credentials 注册凭据
 * @returns 注册响应
 */
export const register = async (credentials: RegisterCredentials): Promise<LoginResponse> => {
  return post<LoginResponse>('/api/auth/register', credentials);
};

/**
 * 用户登录
 * @param credentials 登录凭据
 * @returns 登录响应
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  return post<LoginResponse>('/api/auth/login', credentials);
};

/**
 * 设置认证token到localStorage
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
  
  // 回退到localStorage
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
  // 也可以尝试清除cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
};

/**
 * 检查用户是否已认证
 * @returns 认证检查响应
 */
export const checkAuth = async (): Promise<AuthCheckResponse> => {
  try {
    return await get<AuthCheckResponse>('/api/auth/check');
  } catch (error) {
    removeAuthToken(); // Clear token on error
    throw error;
  }
};

/**
 * 检查用户是否已认证（简化版本）
 * @returns 是否已认证
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  try {
    const data = await checkAuth();
    
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

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export const getUserProfile = async (): Promise<UserInfo> => {
  return get<UserInfo>('/api/auth/profile');
};

/**
 * 刷新认证token
 * @returns 新的token
 */
export const refreshToken = async (): Promise<{ token: string }> => {
  return post<{ token: string }>('/api/auth/refresh', {});
};

/**
 * 用户登出
 */
export const logout = () => {
  removeAuthToken();
};

/**
 * 检查注册是否允许
 * @returns 注册状态
 */
export const checkRegistrationStatus = async (): Promise<RegistrationStatusResponse> => {
  return get<RegistrationStatusResponse>('/api/auth/registration-status');
}; 
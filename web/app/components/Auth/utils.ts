'use client';

type AuthInfo = {
  email: string;
  password: string;
}

/**
 * 保存或移除用户认证信息到本地存储
 * @param authInfo - 用户认证信息
 * @param remember - 是否记住用户认证信息
 */
export const rememberAccount = (authInfo: AuthInfo, remember: boolean) => {
  // 检查是否在浏览器环境中
  if (typeof window !== 'undefined' && window.localStorage) {
    if (!remember) {
      // 如果authInfo为null，移除存储中的认证信息
      localStorage.removeItem('authInfo');
    } else {
      // 将认证信息转换为Base64字符串并存储
      const authInfoBase64 = btoa(JSON.stringify(authInfo));
      localStorage.setItem('authInfo', authInfoBase64);
    }
  }
}

/**
 * 从本地存储中读取用户认证信息
 * @returns 用户认证信息，如果不存在或不在浏览器环境中则返回null
 */
export const readAccount = (): AuthInfo => {
  const emptyAuthInfo: AuthInfo = { email: '', password: '' };
  // 检查是否在浏览器环境中
  if (typeof window === 'undefined' || !window.localStorage) return emptyAuthInfo;

  // 从本地存储中获取Base64编码的认证信息
  const authInfoBase64 = localStorage.getItem('authInfo');
  if (!authInfoBase64) return emptyAuthInfo;

  // 将Base64字符串解码并解析为AuthInfo对象
  const authInfo = JSON.parse(atob(authInfoBase64));
  return authInfo;
}

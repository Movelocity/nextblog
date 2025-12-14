import { get, post, put, del } from './utils';
import { CustomScript } from '@/app/components/JsonEditor/types';

/**
 * 获取所有用户脚本
 * @returns 脚本列表
 */
export const fetchScripts = async (): Promise<CustomScript[]> => {
  try {
    return await get<CustomScript[]>('/api/json-editor/scripts');
  } catch (error) {
    console.error('Failed to fetch scripts:', error);
    throw new Error('获取脚本列表失败');
  }
};

/**
 * 获取单个脚本
 * @param id 脚本ID
 * @returns 脚本对象
 */
export const fetchScript = async (id: string): Promise<CustomScript> => {
  try {
    return await get<CustomScript>(`/api/json-editor/scripts/${id}`);
  } catch (error) {
    console.error('Failed to fetch script:', error);
    throw new Error('获取脚本失败');
  }
};

/**
 * 创建新脚本 (需要认证)
 * @param script 脚本数据
 * @returns 创建的脚本对象
 */
export const createScript = async (
  script: Omit<CustomScript, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CustomScript> => {
  try {
    return await post<CustomScript>('/api/json-editor/scripts', script);
  } catch (error) {
    console.error('Failed to create script:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw new Error('需要登录才能保存脚本');
    }
    throw new Error('创建脚本失败');
  }
};

/**
 * 更新脚本 (需要认证)
 * @param id 脚本ID
 * @param script 脚本更新数据
 * @returns 更新后的脚本对象
 */
export const updateScript = async (
  id: string,
  script: Partial<Omit<CustomScript, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<CustomScript> => {
  try {
    return await put<CustomScript>(`/api/json-editor/scripts/${id}`, script);
  } catch (error) {
    console.error('Failed to update script:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw new Error('需要登录才能更新脚本');
    }
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Error('脚本不存在');
    }
    throw new Error('更新脚本失败');
  }
};

/**
 * 删除脚本 (需要认证)
 * @param id 脚本ID
 * @returns 删除结果
 */
export const deleteScript = async (id: string): Promise<{ success: boolean }> => {
  try {
    return await del<{ success: boolean }>(`/api/json-editor/scripts/${id}`);
  } catch (error) {
    console.error('Failed to delete script:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw new Error('需要登录才能删除脚本');
    }
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Error('脚本不存在');
    }
    throw new Error('删除脚本失败');
  }
};


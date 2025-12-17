/**
 * Notes Service
 * 笔记相关的 API 调用服务
 */

import type { 
  NoteData, 
  NotesListResponse, 
  CreateNoteParams, 
  UpdateNoteParams, 
  GetNotesParams,
  SearchNotesParams,
  NoteSearchResponse
} from '@/app/common/types.notes'
import { get, post, put, del } from './utils'

/**
 * 获取笔记列表
 * @param {GetNotesParams} params - 查询参数，包括分页、标签、公开状态等
 * @returns {Promise<NotesListResponse>} 返回笔记列表和总数
 * @throws {Error} 请求失败时抛出错误
 */
export const fetchNotes = async (params?: GetNotesParams): Promise<NotesListResponse> => {
  // Go 后端返回 { notes: Note[], total: number }
  interface GoNoteListResponse {
    notes: NoteData[];
    total: number;
  }
  
  const response = await get<GoNoteListResponse>('/notes', { params });
  
  // 获取实际使用的参数值
  const actualPage = params?.page || 1;
  const actualPageSize = params?.pageSize || 20;
  
  // 适配返回格式
  return {
    notes: response.notes.map(note => ({
      ...note,
      tags: note.tags || []
    })),
    total: response.total,
    page: actualPage,
    pageSize: actualPageSize
  };
}

/**
 * 获取单个笔记
 * @param {string} id - 笔记ID
 * @returns {Promise<NoteData>} 返回笔记数据
 * @throws {Error} 请求失败时抛出错误
 */
export const fetchNote = async (id: string): Promise<NoteData> => {
  // Go 后端使用 /notes/detail/:id
  return get<NoteData>(`/notes/detail/${id}`);
}

/**
 * 创建新笔记
 * @param {CreateNoteParams} params - 创建笔记的参数
 * @returns {Promise<NoteData>} 返回创建的笔记数据
 * @throws {Error} 请求失败时抛出错误
 */
export const createNote = async (params: CreateNoteParams): Promise<NoteData> => {
  return post<NoteData>('/notes', params);
}

/**
 * 更新笔记
 * @param {UpdateNoteParams} params - 更新笔记的参数，包括ID和要更新的字段
 * @returns {Promise<NoteData>} 返回更新后的笔记数据
 * @throws {Error} 请求失败时抛出错误
 */
export const updateNote = async (params: UpdateNoteParams): Promise<NoteData> => {
  const { id, ...updateData } = params;
  // Go 后端使用 PUT /notes/:id
  return put<NoteData>(`/notes/${id}`, updateData);
}

/**
 * 删除笔记
 * @param {string} id - 要删除的笔记ID
 * @returns {Promise<{ success: boolean }>} 返回删除操作的结果
 * @throws {Error} 请求失败时抛出错误
 */
export const deleteNote = async (id: string): Promise<{ success: boolean }> => {
  // Go 后端使用 DELETE /notes/:id，返回 { message: string }
  await del<{ message: string }>(`/notes/${id}`);
  return { success: true };
}

/**
 * 归档/取消归档笔记
 * @param {string} id - 笔记ID
 * @param {boolean} isArchived - 归档状态
 * @returns {Promise<NoteData>} 返回更新后的笔记数据
 * @throws {Error} 请求失败时抛出错误
 */
export const archiveNote = async (id: string, isArchived: boolean): Promise<NoteData> => {
  return put<NoteData>(`/notes/${id}/archive`, { isArchived });
}

/** 
 * 获取统计信息
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @returns {Promise<Record<string, number>>} 返回日期到笔记数量的映射，格式: {"2024-12-01": 3, "2024-12-02": 5}
 */
export const getStats = async (year: number, month: number): Promise<Record<string, number>> => {
  return get<Record<string, number>>('/notes/stats', { 
    params: { year, month } 
  });
}

/**
 * 搜索笔记（普通搜索）
 * GET /api/notes/search?keyword=xxx&page=1&pageSize=20
 * 
 * @param {SearchNotesParams} params - 搜索参数
 * @returns {Promise<NotesListResponse>} 返回笔记列表和总数
 * @throws {Error} 请求失败时抛出错误
 * 
 * 搜索范围会根据后端登录状态自动调整：
 * - 未登录：仅搜索公开且未归档的笔记
 * - 已登录：搜索所有笔记（包括私有和归档笔记）
 */
export const searchNotes = async (params: SearchNotesParams): Promise<NotesListResponse> => {
  // Go 后端返回 { notes: Note[], total: number }
  interface GoNoteListResponse {
    notes: NoteData[];
    total: number;
  }
  
  const goParams: Record<string, string | number | boolean | undefined> = {
    keyword: params.keyword,
    page: params.page || 1,
    pageSize: params.pageSize || 20,
  };
  
  const response = await get<GoNoteListResponse>('/notes/search', { params: goParams });
  
  // 获取实际使用的参数值
  const actualPage = params.page || 1;
  const actualPageSize = params.pageSize || 20;
  
  // 适配返回格式
  return {
    notes: response.notes.map(note => ({
      ...note,
      tags: note.tags || []
    })),
    total: response.total,
    page: actualPage,
    pageSize: actualPageSize
  };
}

/**
 * 高级搜索笔记（返回匹配上下文）
 * GET /api/notes/search?keyword=xxx&page=1&pageSize=20&highlight=true&contextSize=50
 * 
 * @param {SearchNotesParams} params - 搜索参数，包括关键词、分页、上下文窗口大小等
 * @returns {Promise<NoteSearchResponse>} 返回带匹配上下文的笔记列表
 * @throws {Error} 请求失败时抛出错误
 * 
 * 注意：高级搜索仅登录用户可用，未登录时 highlight 参数会被忽略
 */
export const searchNotesAdvanced = async (params: SearchNotesParams): Promise<NoteSearchResponse> => {
  const goParams: Record<string, string | number | boolean | undefined> = {
    keyword: params.keyword,
    page: params.page || 1,
    pageSize: params.pageSize || 20,
    highlight: true,
    contextSize: params.contextSize || 50,
  };
  
  return get<NoteSearchResponse>('/notes/search', { params: goParams });
}

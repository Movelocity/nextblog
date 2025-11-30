/**
 * Notes Service
 * 笔记相关的 API 调用服务
 */

import type { 
  NoteData, 
  NotesListResponse, 
  CreateNoteParams, 
  UpdateNoteParams, 
  GetNotesParams 
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


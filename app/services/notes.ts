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
  return get<NotesListResponse>('/api/notes', { params })
}

/**
 * 获取单个笔记
 * @param {string} id - 笔记ID
 * @returns {Promise<NoteData>} 返回笔记数据
 * @throws {Error} 请求失败时抛出错误
 */
export const fetchNote = async (id: string): Promise<NoteData> => {
  return get<NoteData>('/api/notes', { params: { id } })
}

/**
 * 创建新笔记
 * @param {CreateNoteParams} params - 创建笔记的参数
 * @returns {Promise<NoteData>} 返回创建的笔记数据
 * @throws {Error} 请求失败时抛出错误
 */
export const createNote = async (params: CreateNoteParams): Promise<NoteData> => {
  return post<NoteData>('/api/notes', params)
}

/**
 * 更新笔记
 * @param {UpdateNoteParams} params - 更新笔记的参数，包括ID和要更新的字段
 * @returns {Promise<NoteData>} 返回更新后的笔记数据
 * @throws {Error} 请求失败时抛出错误
 */
export const updateNote = async (params: UpdateNoteParams): Promise<NoteData> => {
  return put<NoteData>('/api/notes', params)
}

/**
 * 删除笔记
 * @param {string} id - 要删除的笔记ID
 * @returns {Promise<{ success: boolean }>} 返回删除操作的结果
 * @throws {Error} 请求失败时抛出错误
 */
export const deleteNote = async (id: string): Promise<{ success: boolean }> => {
  return del<{ success: boolean }>('/api/notes', { params: { id } })
}


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

/**
 * 获取笔记列表
 */
export const fetchNotes = async (params?: GetNotesParams): Promise<NotesListResponse> => {
  const searchParams = new URLSearchParams()
  
  if (params?.page) searchParams.append('page', params.page.toString())
  if (params?.pageSize) searchParams.append('pageSize', params.pageSize.toString())
  if (params?.tag) searchParams.append('tag', params.tag)
  if (params?.isPublic !== undefined) searchParams.append('isPublic', params.isPublic.toString())
  
  const response = await fetch(`/api/notes?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch notes')
  }
  
  return response.json()
}

/**
 * 获取单个笔记
 */
export const fetchNote = async (id: string): Promise<NoteData> => {
  const response = await fetch(`/api/notes?id=${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch note')
  }
  
  return response.json()
}

/**
 * 创建新笔记
 */
export const createNote = async (params: CreateNoteParams): Promise<NoteData> => {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create note')
  }
  
  return response.json()
}

/**
 * 更新笔记
 */
export const updateNote = async (params: UpdateNoteParams): Promise<NoteData> => {
  const response = await fetch('/api/notes', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update note')
  }
  
  return response.json()
}

/**
 * 删除笔记
 */
export const deleteNote = async (id: string): Promise<{ success: boolean }> => {
  const response = await fetch(`/api/notes?id=${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete note')
  }
  
  return response.json()
}


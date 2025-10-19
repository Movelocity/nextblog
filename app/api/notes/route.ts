import { NextRequest, NextResponse } from "next/server";
import { textFile } from "@/app/api/files"
import path from 'path'
import { readFileSync, writeFileSync, existsSync } from "fs"
import type { NoteData, NoteMeta, NoteIndex } from "@/app/common/types.notes"
import { requireAuth, authenticateRequest } from '@/app/lib/auth';

const NOTES_INDEX = textFile("notes", "index.json", JSON.stringify({ files: {}, tagged: {} }))
const NOTES_DIR = path.dirname(NOTES_INDEX)

/**
 * 生成笔记ID：YYYYMMDDHHMMSSXXXXXX
 */
const generateNoteId = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  
  return `${year}${month}${day}${hour}${minute}${second}${random}`
}

/**
 * 从ID提取日期：YYYYMMDD -> YYYY-MM-DD
 */
const getDateFromId = (id: string): string => {
  const year = id.substring(0, 4)
  const month = id.substring(4, 6)
  const day = id.substring(6, 8)
  return `${year}-${month}-${day}`
}

/**
 * 获取日期文件路径
 */
const getDateFilePath = (date: string): string => {
  return path.join(NOTES_DIR, `${date}.json`)
}

/**
 * 读取索引
 */
const readIndex = (): NoteIndex => {
  try {
    const content = readFileSync(NOTES_INDEX, 'utf-8')
    const parsed = JSON.parse(content)
    // 确保返回的数据结构完整
    return {
      files: parsed.files || {},
      tagged: parsed.tagged || {}
    }
  } catch {
    return { files: {}, tagged: {} }
  }
}

/**
 * 写入索引
 */
const writeIndex = (index: NoteIndex): void => {
  writeFileSync(NOTES_INDEX, JSON.stringify(index, null, 2), 'utf-8')
}

/**
 * 读取日期文件中的所有笔记
 */
const readDateFile = (date: string): NoteData[] => {
  const filePath = getDateFilePath(date)
  if (!existsSync(filePath)) {
    return []
  }
  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

/**
 * 写入日期文件
 */
const writeDateFile = (date: string, notes: NoteData[]): void => {
  const filePath = getDateFilePath(date)
  writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf-8')
}

/**
 * 更新索引中的标签计数
 */
const updateTaggedIndex = (index: NoteIndex): void => {
  const tagged: Record<string, number> = {}
  
  Object.values(index.files).forEach(metas => {
    metas.forEach(meta => {
      meta.tags.forEach(tag => {
        tagged[tag] = (tagged[tag] || 0) + 1
      })
    })
  })
  
  index.tagged = tagged
}

/**
 * 保存笔记（创建或更新）
 */
const saveNote = (note: Partial<NoteData> & { data: string }): NoteData => {
  const index = readIndex()
  const now = new Date().toISOString()
  
  // 如果有ID，则更新现有笔记
  if (note.id) {
    const date = getDateFromId(note.id)
    const notes = readDateFile(date)
    const noteIndex = notes.findIndex(n => n.id === note.id)
    
    if (noteIndex === -1) {
      throw new Error('Note not found')
    }
    
    const existingNote = notes[noteIndex]
    const updatedNote: NoteData = {
      ...existingNote,
      ...note,
      id: note.id,
      updatedAt: now
    }
    
    notes[noteIndex] = updatedNote
    writeDateFile(date, notes)
    
    // 更新索引
    const dateKey = `${date}.json`
    if (index.files[dateKey]) {
      const metaIndex = index.files[dateKey].findIndex(m => m.id === note.id)
      if (metaIndex !== -1) {
        index.files[dateKey][metaIndex] = {
          id: updatedNote.id,
          isPublic: updatedNote.isPublic,
          tags: updatedNote.tags
        }
      }
    }
    
    updateTaggedIndex(index)
    writeIndex(index)
    
    return updatedNote
  }
  
  // 创建新笔记
  const id = generateNoteId()
  const date = getDateFromId(id)
  const newNote: NoteData = {
    id,
    createdAt: now,
    updatedAt: now,
    data: note.data,
    isPublic: note.isPublic ?? false,
    tags: note.tags ?? []
  }
  
  const notes = readDateFile(date)
  notes.push(newNote)
  writeDateFile(date, notes)
  
  // 更新索引
  const dateKey = `${date}.json`
  if (!index.files[dateKey]) {
    index.files[dateKey] = []
  }
  
  index.files[dateKey].push({
    id: newNote.id,
    isPublic: newNote.isPublic,
    tags: newNote.tags
  })
  
  updateTaggedIndex(index)
  writeIndex(index)
  
  return newNote
}

/**
 * 删除笔记
 */
const deleteNote = (id: string): boolean => {
  const date = getDateFromId(id)
  const notes = readDateFile(date)
  const noteIndex = notes.findIndex(n => n.id === id)
  
  if (noteIndex === -1) {
    return false
  }
  
  notes.splice(noteIndex, 1)
  writeDateFile(date, notes)
  
  // 更新索引
  const index = readIndex()
  const dateKey = `${date}.json`
  
  if (index.files[dateKey]) {
    index.files[dateKey] = index.files[dateKey].filter(m => m.id !== id)
    
    // 如果该日期文件没有笔记了，删除该条目
    if (index.files[dateKey].length === 0) {
      delete index.files[dateKey]
    }
  }
  
  updateTaggedIndex(index)
  writeIndex(index)
  
  return true
}

/**
 * 获取单个笔记
 */
const getNote = (id: string): NoteData | null => {
  const date = getDateFromId(id)
  const notes = readDateFile(date)
  return notes.find(n => n.id === id) || null
}

/**
 * 获取笔记列表（支持分页和标签过滤）
 */
const getNotes = (options: {
  page?: number,
  pageSize?: number,
  tag?: string,
  isPublic?: boolean
}): { notes: NoteData[], total: number, page: number, pageSize: number } => {
  const { page = 1, pageSize = 20, tag, isPublic } = options
  const index = readIndex()
  
  let allNotes: NoteData[] = []
  
  // 按日期倒序读取笔记
  const dateFiles = Object.keys(index.files).sort().reverse()
  
  for (const dateFile of dateFiles) {
    const date = dateFile.replace('.json', '')
    const notes = readDateFile(date)
    allNotes = allNotes.concat(notes)
  }
  
  // 按创建时间倒序排序
  allNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  // 过滤
  let filteredNotes = allNotes
  
  if (tag) {
    filteredNotes = filteredNotes.filter(note => note.tags.includes(tag))
  }
  
  if (isPublic !== undefined) {
    filteredNotes = filteredNotes.filter(note => note.isPublic === isPublic)
  }
  
  const total = filteredNotes.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedNotes = filteredNotes.slice(start, end)
  
  return {
    notes: paginatedNotes,
    total,
    page,
    pageSize
  }
}

/**
 * GET 请求处理
 * 查询参数：
 * - id: 获取单个笔记
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 * - tag: 标签过滤
 * - isPublic: 是否公开过滤
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    const user = authenticateRequest(request);
    
    // 获取单个笔记
    if (id) {
      const note = getNote(id)
      if (!note) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        )
      }
      if(!note.isPublic && user==null) {
        return NextResponse.json(
          { error: 'Note not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(note)
    }
    
    // 获取笔记列表
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const tag = searchParams.get('tag') || undefined
    const isPublicParam = searchParams.get('isPublic')
    const isPublic = isPublicParam ? isPublicParam === 'true' : undefined
    
    const result = getNotes({ page, pageSize, tag, isPublic })
    if(user==null) {
      result.notes = result.notes.filter(note => note.isPublic)
    }
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST 请求处理 - 创建新笔记
 * Body: { data: string, isPublic?: boolean, tags?: string[] }
 */
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    if (!body.data) {
      return NextResponse.json(
        { error: 'Data is required' },
        { status: 400 }
      )
    }
    
    const note = saveNote({
      data: body.data,
      isPublic: body.isPublic ?? false,
      tags: body.tags ?? []
    })
    
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
});

/**
 * PUT 请求处理 - 更新笔记
 * Body: { id: string, data?: string, isPublic?: boolean, tags?: string[] }
 */
export const PUT = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    const note = saveNote(body)
    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
});

/**
 * DELETE 请求处理 - 删除笔记
 * 查询参数：id
 */
export const DELETE = requireAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    const success = deleteNote(id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
});
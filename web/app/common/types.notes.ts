/**
 * 笔记相关的类型定义
 */

/** 笔记数据类型 */
export type NoteData = {
  /** 笔记ID，格式：YYYYMMDDHHMMSSXXXXXX */
  id: string,
  /** 创建时间（ISO 8601 格式） */
  createdAt: string,
  /** 更新时间（ISO 8601 格式） */
  updatedAt: string,
  /** 笔记内容 */
  data: string,
  /** 是否公开 */
  isPublic: boolean,
  /** 是否已归档 */
  isArchived: boolean,
  /** 标签列表 */
  tags: string[]
}

/** 笔记元数据类型 */
export type NoteMeta = {
  /** 笔记ID */
  id: string,
  /** 是否公开 */
  isPublic: boolean,
  /** 标签列表 */
  tags: string[],
}

/** 索引数据类型 */
export type NoteIndex = {
  /** 日期文件 -> 笔记元数据列表的映射 */
  files: Record<string, NoteMeta[]>
  /** 标签 -> 笔记数量的映射 */
  tagged: Record<string, number>
}

/** 笔记列表响应类型 */
export type NotesListResponse = {
  /** 笔记列表 */
  notes: NoteData[],
  /** 总数 */
  total: number,
  /** 当前页码 */
  page: number,
  /** 每页数量 */
  pageSize: number
}

/** 创建笔记参数 */
export type CreateNoteParams = {
  /** 笔记内容 */
  data: string,
  /** 是否公开（默认 false） */
  isPublic?: boolean,
  /** 标签列表（默认 []） */
  tags?: string[]
}

/** 更新笔记参数 */
export type UpdateNoteParams = {
  /** 笔记ID */
  id: string,
  /** 笔记内容（可选） */
  data?: string,
  /** 是否公开（可选） */
  isPublic?: boolean,
  /** 标签列表（可选） */
  tags?: string[]
}

/** 获取笔记列表参数 */
export type GetNotesParams = {
  /** 页码（默认 1） */
  page?: number,
  /** 每页数量（默认 20） */
  pageSize?: number,
  /** 标签过滤（可选） */
  tag?: string,
  /** 公开状态过滤（可选） */
  isPublic?: boolean,
  /** 归档状态过滤（可选）：true=仅已归档, false=仅未归档(默认), 'all'=所有笔记 */
  isArchived?: boolean | 'all'
}

/** 笔记搜索参数 */
export type SearchNotesParams = {
  /** 搜索关键词（必填） */
  keyword: string,
  /** 页码（默认 1） */
  page?: number,
  /** 每页数量（默认 20） */
  pageSize?: number,
  /** 是否启用高级搜索（返回匹配上下文，仅登录用户可用） */
  highlight?: boolean,
  /** 上下文窗口大小（默认 50） */
  contextSize?: number
}

/** 搜索匹配结果 */
export type NoteSearchMatch = {
  /** 匹配字段名（data, tags） */
  field: string,
  /** 关键词所在的上下文文本 */
  context: string,
  /** 关键词在原文中的字符偏移位置 */
  offset: number
}

/** 笔记搜索结果（支持高级搜索） */
export type NoteSearchResult = NoteData & {
  /** 匹配次数（仅高级搜索时返回） */
  matchCount?: number,
  /** 匹配详情（仅高级搜索时返回） */
  matches?: NoteSearchMatch[]
}

/** 笔记搜索响应 */
export type NoteSearchResponse = {
  /** 笔记列表 */
  notes: NoteSearchResult[],
  /** 总数 */
  total: number
}


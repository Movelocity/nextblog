import { NextResponse } from "next/server";
import { textFile } from "@/app/api/files"
import { readFileSync } from "fs"
import type { NoteIndex } from "@/app/common/types.notes"

/**
 * GET 请求处理 - 获取笔记统计数据
 * 返回索引文件中的统计信息
 */
export async function GET() {
  try {
    const NOTES_INDEX = textFile("notes", "index.json", JSON.stringify({ files: {}, tagged: {} }))
    
    const content = readFileSync(NOTES_INDEX, 'utf-8')
    const index: NoteIndex = JSON.parse(content)
    
    return NextResponse.json(index)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


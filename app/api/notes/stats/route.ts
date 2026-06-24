import { NextRequest, NextResponse } from "next/server";
import { textFile } from "@/app/api/files"
import { readFileSync } from "fs"
import { authenticateRequest } from "@/app/lib/auth"
import type { NoteIndex, NoteMeta } from "@/app/common/types.notes"

/**
 * GET 请求处理 - 获取笔记统计数据
 * 返回索引文件中的统计信息。
 * 安全性：未登录用户仅能看到公开笔记的统计（标签计数、日期分布），
 *        私密笔记的元数据不会被泄露。
 */
export async function GET(request: NextRequest) {
  try {
    const NOTES_INDEX = textFile("notes", "index.json", JSON.stringify({ files: {}, tagged: {} }))

    const content = readFileSync(NOTES_INDEX, 'utf-8')
    const rawIndex: NoteIndex = JSON.parse(content)

    const user = authenticateRequest(request)

    // 未登录用户：过滤掉私密笔记的元数据，重新统计
    if (!user) {
      const filteredFiles: Record<string, NoteMeta[]> = {}
      for (const [dateFile, metas] of Object.entries(rawIndex.files)) {
        const publicMetas = metas.filter(m => m.isPublic)
        if (publicMetas.length > 0) {
          filteredFiles[dateFile] = publicMetas
        }
      }
      const tagged: Record<string, number> = {}
      Object.values(filteredFiles).forEach(metas => {
        metas.forEach(meta => {
          meta.tags.forEach(tag => {
            tagged[tag] = (tagged[tag] || 0) + 1
          })
        })
      })
      return NextResponse.json({ files: filteredFiles, tagged })
    }

    return NextResponse.json(rawIndex)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server";
import { IMAGE_DIR } from "../utils";
import fs from 'fs'
import path from 'path'
import { requireAuth } from '@/app/lib/auth';

/**
 * Get a file
 * GET /api/image-edit/file?id={id}
 */
export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // 安全验证
    if (!id || id.includes('..') || id.includes('/')) {
      return NextResponse.json(
        { error: '无效的文件名' },
        { status: 400 }
      )
    }
    
    const filePath = path.join(IMAGE_DIR, id)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      )
    }
    
    // 获取文件信息
    const stats = fs.statSync(filePath)
    // 读取文件为 Buffer
    const fileBuffer = fs.readFileSync(filePath)
    
    // 根据文件扩展名设置 MIME 类型
    const ext = path.extname(id).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }
    const contentType = mimeTypes[ext] || 'application/octet-stream'
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${id}"`,
        'Content-Length': stats.size.toString(),
      },
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

/**
 * Update a file
 * POST /api/image-edit/file?id={id}
 * Body: FormData with fields:
 * - file: File
 */
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const ext = path.extname(file.name).toLowerCase();
    const id = file.name + ext;
    const filePath = path.join(IMAGE_DIR, id)
    const fileBuffer = await file.arrayBuffer()
    fs.writeFileSync(filePath, Buffer.from(fileBuffer))
    return NextResponse.json(
      { id: id },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
})

export const DELETE = requireAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if(!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    const filePath = path.join(IMAGE_DIR, id)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: '文件不存在' },
        { status: 404 }
      )
    }
    fs.unlinkSync(filePath)
    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
})
import path from 'path';
import { BLOG_CONFIG } from '@/app/common/globals';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

/** 在项目的存储目录下准备一个文本文件 */
export const textFile = (dir: string, file_name: string, initial_content?: string): string => {
  const file_path = path.join(BLOG_CONFIG.ROOT_DIR, dir, file_name)
  const file_dir = path.dirname(file_path)
  if(!existsSync(file_dir)) {
    mkdirSync(file_dir, {recursive: true})
  }
  if(!existsSync(file_path)) {
    writeFileSync(file_path, initial_content || "")
  }
  return file_path
}

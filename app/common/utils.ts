import { Blog, BlogMeta, Post } from "./types";


// Convert Blog to Post interface
export function blogToPost(blog: Blog|BlogMeta): Post {
  return {
    id: blog.id,
    title: blog.title,
    content: blog.description,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    published: blog.published,
    categories: blog.categories || [],
    tags: blog.tags || []
  };
}

export const textPreview = (md: string) => {
  return md.replace(/<[^>]*>?/gm, '').replace(/[#`-]/g, '').replace(/\([^)]*\)/g, '').trim().split(/\s+/).slice(0, 50).join(' ');
}
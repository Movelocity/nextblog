import { Blog, BlogMeta, Post } from "./types";


// Convert Blog to Post interface
export function blogToPost(blog: Blog|BlogMeta): Post {
  return {
    id: blog.id,
    title: blog.title,
    content: blog.description,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    slug: blog.id, // Using id as slug
    published: blog.published,
    categories: blog.categories || [],
    tags: blog.tags || []
  };
}
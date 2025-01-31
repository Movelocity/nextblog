import { NextRequest, NextResponse } from 'next/server';
import { CreatePostInput, UpdatePostInput, Post, Blog, BlogMeta } from '@/app/common/types';
import blogStorage from '@/app/lib/BlogStorage';
import { requireAuth, authenticateRequest } from '@/app/lib/auth';

// Convert Blog to Post interface
function blogToPost(blog: Blog): Post {
  return {
    id: blog.id,
    title: blog.title,
    content: blog.content,
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    slug: blog.id, // Using id as slug
    published: blog.published,
    categories: blog.categories || [],
    tags: blog.tags || []
  };
}

/**
 * 查询博客列表，支持分页、过滤、搜索、排序等
 * searchParams:
 *  - id: 博客ID
 *  - page: 页码
 *  - limit: 每页数量
 *  - pubOnly: 是否只查询已发布的博客, false 需要鉴权生效
 *  - query: 搜索关键词
 *  - categories: 分类列表
 *  - tags: 标签列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  try {
    // If id is provided, return single post
    if (id) {
      const blog = await blogStorage.getBlog(id);
      if (!blog) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      if(!blog.published && authenticateRequest(request)==null) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      return NextResponse.json(blogToPost(blog));
    }

    // List blogs
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    let pubOnly = true;
    if(searchParams.get("pubOnly") === 'false' && authenticateRequest(request)!=null) pubOnly = false;
    const query = searchParams.get('query') || '';
    const categories = JSON.parse(searchParams.get('categories') || '[]');
    const tags = JSON.parse(searchParams.get('tags') || '[]');

    let blogMetas: BlogMeta[];
    let blogsCount = 0;
    if(pubOnly) {
      // published posts only
      const { blogs, total } = await blogStorage.listBlogs({ 
        page, 
        page_size: limit, 
        published_only: true,
        categories,
        tags,
        query
      });
      blogMetas = blogs;
      blogsCount = total;
    } else {
      // get both published and draft posts, admin only (getting draft with single id is permitted)
      const { blogs, total } = await blogStorage.listBlogs({ 
        page, 
        page_size: limit, 
        published_only: false,
        categories,
        tags,
        query
      });
      blogMetas = blogs;
      blogsCount = total;
    }
    
    // Fetch full blog content for each meta
    const blogs = await Promise.all(blogMetas.map(meta => blogStorage.getBlog(meta.id)));
    const posts = blogs.map(blogToPost);
    
    return NextResponse.json({
      posts,
      total: blogsCount
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// Protected routes using requireAuth
export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body: CreatePostInput = await request.json();
    
    const newBlog = await blogStorage.createBlog({
      id: Date.now().toString(),
      title: body.title,
      description: body.title, // Using title as description for now
      content: body.content,
      published: body.published,
      categories: body.categories || [],
      tags: body.tags || []
    });
    
    return NextResponse.json(blogToPost(newBlog), { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
});

export const PUT = requireAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const body: UpdatePostInput = await request.json();
    const updatedBlog = await blogStorage.updateBlog(id, {
      title: body.title,
      description: body.title, // Using title as description for now
      content: body.content,
      published: body.published,
      categories: body.categories,
      tags: body.tags
    });
    
    return NextResponse.json(blogToPost(updatedBlog));
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
});

export const DELETE = requireAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await blogStorage.deleteBlog(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}); 
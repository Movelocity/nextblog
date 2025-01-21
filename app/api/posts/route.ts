import { NextRequest, NextResponse } from 'next/server';
import { CreatePostInput, UpdatePostInput, Post, BlogMeta } from '@/app/common/types';
import blogStorage from '@/app/lib/BlogStorage';
import { requireAuth, authenticateRequest } from '@/app/lib/auth';

// Convert Blog to Post interface
function blogToPost(blog: Awaited<ReturnType<typeof blogStorage.getBlog>>): Post {
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

// GET is public - no auth required
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const getAll = searchParams.get('getAll') === 'true';
  const query = searchParams.get('query') || '';
  const categories = JSON.parse(searchParams.get('categories') || '[]');
  const tags = JSON.parse(searchParams.get('tags') || '[]');
  
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

    // Get all blog metas based on visibility
    let blogMetas: BlogMeta[];
    if(getAll && authenticateRequest(request)!=null) {
      // get all posts, admin only
      blogMetas = await blogStorage.listBlogs({ page, page_size: limit, published_only: false });
    } else {
      // published posts only
      blogMetas = await blogStorage.listBlogs({ page, page_size: limit, published_only: true });
    }
    
    // Fetch full blog content for each meta
    const blogs = await Promise.all(blogMetas.map(meta => blogStorage.getBlog(meta.id)));
    let posts = blogs.map(blogToPost);
    
    // Apply search filters
    if (query || categories.length || tags.length) {
      posts = posts.filter(post => {
        const matchesQuery = query ? 
          post.title.toLowerCase().includes(query.toLowerCase()) || 
          post.content.toLowerCase().includes(query.toLowerCase()) 
          : true;
          
        const matchesCategories = categories.length ? 
          categories.some((cat: string) => post.categories.includes(cat))
          : true;
          
        const matchesTags = tags.length ? 
          tags.some((tag: string) => post.tags.includes(tag))
          : true;
          
        return matchesQuery && matchesCategories && matchesTags;
      });
    }
    
    return NextResponse.json({
      posts,
      total: posts.length
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
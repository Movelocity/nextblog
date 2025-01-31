import { NextResponse } from 'next/server';
import blogStorage from '@/app/lib/BlogStorage';

export async function GET() {
  try {
    // Get all blogs to ensure meta cache is up to date
    const { blogs_info } = await blogStorage.listBlogs();
    
    // Extract unique categories and tags
    const categories = new Set<string>();
    const tags = new Set<string>();
    
    blogs_info.forEach(blog => {
      blog.categories?.forEach(cat => categories.add(cat));
      blog.tags?.forEach(tag => tags.add(tag));
    });

    return NextResponse.json({
      categories: Array.from(categories),
      tags: Array.from(tags)
    });
  } catch (error) {
    console.error('Error fetching taxonomy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch taxonomy' },
      { status: 500 }
    );
  }
} 
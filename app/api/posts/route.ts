import { NextRequest, NextResponse } from 'next/server';
import { CreatePostInput, Post } from '@/app/common/config';

// In-memory store for development, replace with your database
let posts: Post[] = [];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return NextResponse.json({
    posts: posts.slice(start, end),
    total: posts.length,
    page,
    limit
  });
}

export async function POST(request: NextRequest) {
  const body: CreatePostInput = await request.json();
  
  const newPost: Post = {
    id: Date.now().toString(),
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  posts.push(newPost);
  
  return NextResponse.json(newPost, { status: 201 });
} 
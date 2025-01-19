import { NextRequest, NextResponse } from 'next/server';
import { UpdatePostInput, Post } from '@/app/common/config';

// This should be imported from file systemin production
declare let posts: Post[];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = posts.find(p => p.id === params.id);
  
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body: UpdatePostInput = await request.json();
  const index = posts.findIndex(p => p.id === params.id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  posts[index] = {
    ...posts[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(posts[index]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = posts.findIndex(p => p.id === params.id);
  
  if (index === -1) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }
  
  const deletedPost = posts[index];
  posts = posts.filter(p => p.id !== params.id);
  
  return NextResponse.json(deletedPost);
} 
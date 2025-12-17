import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const apiBaseUrl = process.env.API_BASE_URL;
  return NextResponse.json({ apiBaseUrl });
}
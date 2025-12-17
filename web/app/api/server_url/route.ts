import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiBaseUrl = process.env.API_BASE_URL;
  return NextResponse.json({ apiBaseUrl });
}
// pages/api/upload.js
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  // The request body should contain the file data
  const { filename } = request.nextUrl.searchParams;
  const blob = await put(filename, request.body, {
    access: 'public',
  });

  // The 'blob' object contains the URL of the uploaded file
  return NextResponse.json(blob);
}
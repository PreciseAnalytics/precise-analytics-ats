// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'resume' or 'cover_letter'
    const applicationId = formData.get('applicationId') as string;

    console.log('📤 Upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      type: type
    });

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only PDF, DOC, and DOCX files are allowed.'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size exceeds 5MB limit'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const sanitizedType = type || 'document';
    const appId = applicationId || 'temp';
    
    const filename = `ats-files/${sanitizedType}/${appId}-${timestamp}-${randomId}.${fileExtension}`;

    console.log('📤 Uploading file:', {
      originalName: file.name,
      size: file.size,
      type: file.type,
      filename: filename
    });

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('✅ File uploaded successfully:', {
      url: blob.url,
      filename: filename,
      size: file.size
    });

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ File upload error:', error);

    let errorMessage = 'File upload failed';
    let statusCode = 500;

    if (error.message?.includes('storage limit')) {
      errorMessage = 'Storage limit exceeded. Please try again later or contact support.';
      statusCode = 507; // Insufficient Storage
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network error during upload. Please check your connection and try again.';
      statusCode = 502; // Bad Gateway
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Upload timeout. Please try uploading a smaller file or try again.';
      statusCode = 408; // Request Timeout
    } else if (error.message?.includes('BLOB_READ_WRITE_TOKEN')) {
      errorMessage = 'File storage configuration error. Please contact support.';
      statusCode = 503; // Service Unavailable
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, {
      status: statusCode,
      headers: corsHeaders
    });
  }
}

// Optional: GET endpoint to retrieve file info (for ATS dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'File URL is required'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Basic file info extraction from URL
    const filename = url.split('/').pop() || '';
    const parts = filename.split('-');
    
    // Try to extract application ID from filename
    let applicationId: string | null = null;
if (parts.length >= 2) {
  applicationId = parts[0];  // Now this works because applicationId can be string or null
}
    
    return NextResponse.json({
      success: true,
      filename: filename,
      url: url,
      applicationId: applicationId,
      accessible: true
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('❌ File info retrieval error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve file information',
      details: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}
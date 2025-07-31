import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// Shared logic for both PATCH and PUT
async function handleStatusUpdate(request: NextRequest, id: string) {
  try {
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ success: false, error: 'Missing status' }, { status: 400 });
    }

    const result = await sql`
      UPDATE applications
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, status, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      application: result[0],
    });

  } catch (error: any) {
    console.error('❌ Error updating status:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// PATCH handler
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return handleStatusUpdate(request, params.id);
}

// PUT handler
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return handleStatusUpdate(request, params.id);
}

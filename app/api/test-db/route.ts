import { NextResponse } from 'next/server';
import { testConnection } from '../../../lib/db';

export async function GET() {
  try {
    const connectionTest = await testConnection();
    
    if (connectionTest.success) {
      return NextResponse.json({
        status: 'success',
        message: connectionTest.message,
        timestamp: connectionTest.timestamp,
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: connectionTest.message,
        error: connectionTest.error,
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test database connection',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/services/rag';

export async function GET(request: NextRequest) {
  try {
    const categories = ragService.getCategories();
    const topics = ragService.getTopicsForFallback();

    return NextResponse.json({
      categories,
      topics,
    });
  } catch (error) {
    console.error('Legal categories error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

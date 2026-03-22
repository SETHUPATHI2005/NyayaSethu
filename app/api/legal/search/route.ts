import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/services/rag';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const language = searchParams.get('lang') || 'en';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      );
    }

    const results = ragService.search(query, language, limit);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Legal search error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

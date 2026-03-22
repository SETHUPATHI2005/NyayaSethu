import { NextRequest, NextResponse } from 'next/server';
import { getCategories } from '@/lib/services/rag';

export async function GET(request: NextRequest) {
  try {
    const categories = getCategories();

    return NextResponse.json({
      categories,
      topics: categories,
    });
  } catch (error) {
    console.error('Legal categories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chat';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId' },
        { status: 400 }
      );
    }

    const sessions = chatService.getSessions(userId);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

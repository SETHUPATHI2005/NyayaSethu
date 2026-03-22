import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, language } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Missing userId' },
        { status: 400 }
      );
    }

    const session = chatService.createSession(userId, language || 'en');

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      session,
    });
  } catch (error) {
    console.error('Chat session error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

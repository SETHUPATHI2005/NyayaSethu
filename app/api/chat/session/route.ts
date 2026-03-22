import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/services/chat';
import { getCurrentUser } from '@/lib/services/auth';

export async function POST(request: NextRequest) {
  try {
    const { user, error: userError } = await getCurrentUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { language } = body;

    const session = await createSession(user.id, language || 'en');

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      session,
    });
  } catch (error) {
    console.error('Chat session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessions, deleteSession } from '@/lib/services/chat';
import { getCurrentUser } from '@/lib/services/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { user, error: userError } = await getCurrentUser();

    if (userError || !user || user.id !== params.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessions = await getSessions(user.id);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { user, error: userError } = await getCurrentUser();

    if (userError || !user || user.id !== params.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    const success = await deleteSession(user.id, sessionId);

    return NextResponse.json({
      success,
      message: success ? 'Session deleted' : 'Failed to delete session',
    });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

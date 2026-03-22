import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, language } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = authService.register(email, password, name, language || 'en');

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    const token = authService.generateToken(result.user!.id);

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing email or password' },
        { status: 400 }
      );
    }

    const result = authService.login(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 401 }
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
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

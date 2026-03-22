import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/services/chat';
import { generateResponse } from '@/lib/services/llm';
import { search } from '@/lib/services/rag';
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
    const { sessionId, message, language } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add user message to database
    await addMessage(user.id, sessionId, 'user', message, language || 'en');

    // Search for relevant legal information
    const searchResults = search(message, 3);
    let context = '';
    
    if (searchResults.length > 0) {
      context = searchResults.map(r => `${r.title}: ${r.excerpt}`).join('\n\n');
    }

    // Generate response from LLM
    const llmResponse = await generateResponse(message, context, language || 'en');

    // Add assistant response to database
    await addMessage(user.id, sessionId, 'assistant', llmResponse, language || 'en');

    return NextResponse.json({
      success: true,
      response: llmResponse,
      sources: searchResults.map(r => r.title),
    });
  } catch (error) {
    console.error('Chat message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/lib/services/chat';
import { llmService } from '@/lib/services/llm';
import { ragService } from '@/lib/services/rag';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, message, language } = body;

    if (!sessionId || !userId || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Add user message to session
    chatService.addMessage(userId, sessionId, 'user', message, language || 'en');

    // Search for relevant legal information
    const searchResults = ragService.search(message, language || 'en', 3);
    let context = '';
    
    if (searchResults.length > 0) {
      context = searchResults.map(r => `${r.title}: ${r.excerpt}`).join('\n\n');
    }

    // Generate response from LLM
    const llmResponse = await llmService.generateResponse(message, context, language || 'en');

    // Add assistant response to session
    chatService.addMessage(userId, sessionId, 'assistant', llmResponse.text, language || 'en');

    return NextResponse.json({
      success: true,
      response: llmResponse.text,
      sources: searchResults.map(r => r.title),
    });
  } catch (error) {
    console.error('Chat message error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

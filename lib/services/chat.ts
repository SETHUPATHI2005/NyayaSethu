import { createClient } from '@/lib/supabase/server';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  language: string;
}

export async function createSession(userId: string, language: string = 'en'): Promise<ChatSession | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      title: 'New Chat',
      language,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    messages: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    language: data.language,
  };
}

export async function getSession(userId: string, sessionId: string): Promise<ChatSession | null> {
  const supabase = await createClient();
  
  const { data: sessionData, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single();

  if (sessionError) return null;

  const { data: messagesData } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  return {
    id: sessionData.id,
    userId: sessionData.user_id,
    title: sessionData.title,
    messages: (messagesData || []).map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.created_at,
      language: m.language,
    })),
    createdAt: sessionData.created_at,
    updatedAt: sessionData.updated_at,
    language: sessionData.language,
  };
}

export async function addMessage(
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
  language: string = 'en'
): Promise<ChatMessage | null> {
  const supabase = await createClient();

  const { data: messageData, error: messageError } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      language,
    })
    .select()
    .single();

  if (messageError) {
    console.error('Error adding message:', messageError);
    return null;
  }

  const { data: sessionData } = await supabase
    .from('chat_sessions')
    .select('title')
    .eq('id', sessionId)
    .single();

  if (sessionData?.title === 'New Chat' && role === 'user') {
    await supabase
      .from('chat_sessions')
      .update({
        title: content.substring(0, 50),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  } else {
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  return {
    id: messageData.id,
    role: messageData.role,
    content: messageData.content,
    timestamp: messageData.created_at,
    language: messageData.language,
  };
}

export async function getSessions(userId: string): Promise<ChatSession[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error getting sessions:', error);
    return [];
  }

  return (data || []).map(session => ({
    id: session.id,
    userId: session.user_id,
    title: session.title,
    messages: [],
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    language: session.language,
  }));
}

export async function deleteSession(userId: string, sessionId: string): Promise<boolean> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  return !error;
}

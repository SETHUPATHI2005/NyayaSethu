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

// In-memory storage for demo purposes
// For production, integrate with a database like Supabase, Neon, or AWS RDS
const sessionStore: Map<string, ChatSession[]> = new Map();

class ChatService {
  createSession(userId: string, language: string = 'en'): ChatSession {
    const sessionId = this.generateId();
    const session: ChatSession = {
      id: sessionId,
      userId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language,
    };

    if (!sessionStore.has(userId)) {
      sessionStore.set(userId, []);
    }
    sessionStore.get(userId)?.push(session);
    return session;
  }

  getSession(userId: string, sessionId: string): ChatSession | null {
    const sessions = sessionStore.get(userId) || [];
    return sessions.find(s => s.id === sessionId) || null;
  }

  addMessage(userId: string, sessionId: string, role: 'user' | 'assistant', content: string, language: string = 'en'): ChatMessage | null {
    const session = this.getSession(userId, sessionId);
    if (!session) return null;

    const message: ChatMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: new Date().toISOString(),
      language,
    };

    session.messages.push(message);
    session.updatedAt = new Date().toISOString();

    // Update title from first user message if still default
    if (session.title === 'New Chat' && role === 'user' && session.messages.length <= 2) {
      session.title = content.substring(0, 50);
    }

    return message;
  }

  getSessions(userId: string): ChatSession[] {
    const sessions = sessionStore.get(userId) || [];
    return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  deleteSession(userId: string, sessionId: string): boolean {
    const sessions = sessionStore.get(userId);
    if (!sessions) return false;

    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions.splice(index, 1);
      return true;
    }
    return false;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}

export const chatService = new ChatService();

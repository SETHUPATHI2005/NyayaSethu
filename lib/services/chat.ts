import fs from 'fs';
import path from 'path';

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

class ChatService {
  private chatDir = path.join(process.cwd(), 'public/data/chats');

  constructor() {
    this.ensureDir();
  }

  private ensureDir() {
    if (!fs.existsSync(this.chatDir)) {
      fs.mkdirSync(this.chatDir, { recursive: true });
    }
  }

  private getSessionPath(userId: string, sessionId: string): string {
    return path.join(this.chatDir, `${userId}_${sessionId}.json`);
  }

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

    this.saveSession(session);
    return session;
  }

  getSession(userId: string, sessionId: string): ChatSession | null {
    try {
      const filePath = this.getSessionPath(userId, sessionId);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading session:', error);
    }
    return null;
  }

  saveSession(session: ChatSession) {
    try {
      this.ensureDir();
      const filePath = this.getSessionPath(session.userId, session.id);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('Error saving session:', error);
    }
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

    this.saveSession(session);
    return message;
  }

  getSessions(userId: string): ChatSession[] {
    try {
      const files = fs.readdirSync(this.chatDir);
      const userFiles = files.filter(f => f.startsWith(`${userId}_`));

      return userFiles
        .map(file => {
          try {
            const data = fs.readFileSync(path.join(this.chatDir, file), 'utf-8');
            return JSON.parse(data);
          } catch {
            return null;
          }
        })
        .filter((s): s is ChatSession => s !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch (error) {
      console.error('Error listing sessions:', error);
      return [];
    }
  }

  deleteSession(userId: string, sessionId: string): boolean {
    try {
      const filePath = this.getSessionPath(userId, sessionId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
    return false;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
}

export const chatService = new ChatService();

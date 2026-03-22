import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  language: string;
  createdAt: string;
  lastLogin: string;
}

// In-memory storage for demo purposes
// For production, integrate with a database like Supabase, Neon, or AWS RDS
const memoryStore: { users: User[] } = { users: [] };

class AuthService {
  private users: User[] = memoryStore.users;

  private hashPassword(password: string): string {
    return crypto
      .pbkdf2Sync(password, 'nyayamithran_salt', 10000, 64, 'sha512')
      .toString('hex');
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  register(email: string, password: string, name: string, language: string = 'en'): { success: boolean; message: string; user?: Omit<User, 'password'> } {
    // Validate email
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Invalid email address' };
    }

    // Check if user exists
    if (this.users.some(u => u.email === email)) {
      return { success: false, message: 'User already exists' };
    }

    // Validate password
    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    const user: User = {
      id: crypto.randomUUID(),
      email,
      password: this.hashPassword(password),
      name,
      language,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    this.users.push(user);

    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  login(email: string, password: string): { success: boolean; message: string; user?: Omit<User, 'password'> } {
    const user = this.users.find(u => u.email === email);

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!this.verifyPassword(password, user.password)) {
      return { success: false, message: 'Invalid password' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();

    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
    };
  }

  getUserById(id: string): Omit<User, 'password'> | undefined {
    const user = this.users.find(u => u.id === id);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return undefined;
  }

  updateUserLanguage(userId: string, language: string): boolean {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.language = language;
      return true;
    }
    return false;
  }

  verifyToken(token: string): Omit<User, 'password'> | null {
    // Simple token verification - in production, use JWT
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      return this.getUserById(userId) || null;
    } catch {
      return null;
    }
  }

  generateToken(userId: string): string {
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
  }
}

export const authService = new AuthService();

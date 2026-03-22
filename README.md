# NyayaMithran — AI Legal Guidance for India

AI-powered legal assistance for every Indian citizen. Free, multilingual, always available.

## Overview

NyayaMithran is a modern, fullstack **Next.js 16** application with React components, TypeScript, and **Supabase PostgreSQL** database. This enables:

- **Server-side rendering** for better SEO
- **API routes** for backend logic  
- **React components** for dynamic UIs
- **Supabase PostgreSQL** for secure, scalable data persistence
- **Row Level Security (RLS)** for user data protection
- **Serverless deployment** ready (Vercel, AWS Lambda, etc.)

---

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account (free tier available at https://supabase.com)
- Git for version control

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SETHUPATHI2005/NyayaMithran.git
cd NyayaMithran
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Supabase

1. **Create a Supabase Project:**
   - Go to https://supabase.com and sign up/login
   - Click "New Project" and fill in the details
   - Wait for the project to be created

2. **Get Your Credentials:**
   - Go to Project Settings → API
   - Copy `Project URL` and `anon public` key
   - Also copy `service_role key` for server-side operations

3. **Create Environment Variables:**
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Fill in your Supabase credentials:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     NEXT_PUBLIC_SITE_URL=http://localhost:3000
     ```

4. **Run Database Migrations:**
   - Open Supabase SQL Editor
   - Copy the contents of `scripts/001_create_tables.sql`
   - Paste and execute in the SQL Editor
   - This creates: `profiles`, `chat_sessions`, `chat_messages` tables with RLS policies

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

---

## Tech Stack

**Frontend:**
- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS
- SWR for data fetching
- Lucide React for icons

**Backend:**
- Next.js API Routes (Node.js)
- Supabase PostgreSQL
- Row Level Security (RLS)
- Auth Service (Supabase Auth)

**Services:**
- RAG Service (keyword search + topic fallback for legal documents)
- LLM Service (fallback responses with keyword matching)
- Auth Service (Supabase authentication)
- Chat Service (Supabase PostgreSQL persistence)

---

## Project Structure

```
nyayamithran/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Landing page
│   ├── globals.css                 # Global styles
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts     # User registration
│   │   │   └── login/route.ts      # User authentication
│   │   ├── chat/
│   │   │   ├── session/route.ts    # Create chat session
│   │   │   ├── message/route.ts    # Send/receive messages
│   │   │   └── sessions/[userId]/route.ts # List sessions
│   │   ├── legal/
│   │   │   ├── search/route.ts     # Search legal documents
│   │   │   └── categories/route.ts # Get categories
│   ├── auth/
│   │   ├── login/page.tsx          # Login page (Supabase)
│   │   ├── sign-up/page.tsx        # Signup page (Supabase)
│   │   ├── callback/route.ts       # Auth callback
│   │   └── error/page.tsx          # Auth error page
│   ├── chat/
│   │   └── page.tsx                # Chat interface
│   ├── dashboard/
│   │   └── page.tsx                # User dashboard
│   ├── documents/
│   │   └── page.tsx                # Legal documents
│   └── legal-aid/
│       └── page.tsx                # Legal search page
├── components/
│   ├── Navigation.tsx              # Navigation bar
│   ├── ChatInterface.tsx           # Chat UI
│   ├── ChatMessage.tsx             # Message component
│   ├── ChatInput.tsx               # Input area
│   ├── LegalSearch.tsx             # Search component
│   └── DocumentGenerator.tsx       # Doc generator
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── proxy.ts                # Proxy handlers
│   └── services/
│       ├── auth.ts                 # Auth service
│       ├── chat.ts                 # Chat service
│       ├── rag.ts                  # RAG service
│       └── llm.ts                  # LLM service
├── middleware.ts                   # Auth middleware
├── next.config.js                  # Next.js config
├── tailwind.config.js              # Tailwind config
├── tsconfig.json                   # TypeScript config
├── package.json                    # Dependencies
├── scripts/
│   └── 001_create_tables.sql       # Database schema
└── public/
    ├── data/
    │   ├── users.json              # User data (deprecated)
    │   ├── indian_laws_en.json     # Legal documents
    │   └── chats/                  # Chat history (deprecated)
```

---

## Database Schema

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  language TEXT DEFAULT 'en',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Chat Sessions Table
```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT DEFAULT 'New Chat',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id),
  role TEXT NOT NULL ('user', 'assistant'),
  content TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);
```

All tables have RLS policies enabled to ensure users can only access their own data.

---

## Features

### 1. Authentication
- Email/password signup with Supabase Auth
- Email confirmation required
- Secure session management with HTTP-only cookies
- Multi-language support (English, Hindi)

### 2. Chat Interface
- Create multiple chat sessions
- Real-time message history with Supabase
- AI-powered legal responses
- Voice input support (browser native)
- File attachment support

### 3. Legal Information
- RAG-powered search on Indian laws
- Topic-based fallback suggestions
- Keyword matching for legal documents
- Category-based browsing

### 4. Document Generator
- 6 legal document templates
- Form-based input
- PDF export functionality
- Multi-language support

### 5. Dashboard
- Chat session statistics
- Recent conversations
- Quick access to features
- User profile management

---

## API Routes

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/callback` - Email confirmation callback

### Chat
- `POST /api/chat/session` - Create new session
- `POST /api/chat/message` - Send message
- `GET /api/chat/sessions/[userId]` - List user's sessions
- `DELETE /api/chat/sessions/[userId]` - Delete session

### Legal
- `GET /api/legal/search?q=query` - Search legal documents
- `GET /api/legal/categories` - Get legal categories

---

## Environment Variables

Required for Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase public anon key
NEXT_PUBLIC_SITE_URL=            # Your app URL (for email redirects)
```

Optional:
```env
HUGGINGFACE_API_KEY=             # For enhanced LLM responses
OPENAI_API_KEY=                  # For OpenAI integration
```

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com and import the repository
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Deploy Elsewhere

The app is fully serverless-ready and can be deployed to:
- AWS Lambda
- Google Cloud Run
- Azure Functions
- Self-hosted Node.js servers

---

## Development

### Run Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
npm run start
```

### Lint Code
```bash
npm run lint
```

---

## Troubleshooting

### "Supabase URL or Key not found"
- Check `.env.local` has correct NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Restart dev server after changing env vars

### "Email confirmation failed"
- Ensure NEXT_PUBLIC_SITE_URL matches your actual domain
- Check Supabase email settings in Project → Authentication → Email

### "Chat not saving"
- Verify RLS policies are enabled in Supabase
- Check user authentication with `getCurrentUser()` in services

### "Legal search not working"
- Ensure `public/data/indian_laws_en.json` exists
- Verify RAG service can load the legal documents

---

## Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/SETHUPATHI2005/NyayaMithran/issues
- Email: support@nyayamithran.in

---

## Acknowledgments

- Built with Next.js, React, and Tailwind CSS
- Legal data from Indian law resources
- Powered by Supabase for database and authentication

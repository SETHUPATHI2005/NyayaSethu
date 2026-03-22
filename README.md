# NyayaMithran — AI Legal Guidance for India

AI-powered legal assistance for every Indian citizen. Free, multilingual, always available.

## Overview

NyayaMithran has been converted from a FastAPI/Python backend with vanilla HTML/CSS/JS frontend to a modern, fullstack **Next.js 16** application with React components and TypeScript. This enables:

- **Server-side rendering** for better SEO
- **API routes** for backend logic
- **React components** for dynamic UIs
- **Built-in file system storage** for user data and chat history
- **Serverless deployment** ready (Vercel, AWS Lambda, etc.)

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
- File-based JSON storage (users, chat sessions)
- RAG Service (keyword search + topic fallback)
- LLM Service (Hugging Face/OpenAI with fallback)
- Auth Service (password hashing with PBKDF2)

**Data:**
- `public/data/indian_laws_en.json` - Legal document corpus
- `public/data/users.json` - User accounts
- `public/data/chats/` - Chat session history

---

## Project Structure

```
nyayamithran/
├── app/
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Landing/home page
│   ├── globals.css               # Global styles & Tailwind
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts   # User registration
│   │   │   └── login/route.ts    # User authentication
│   │   ├── chat/
│   │   │   ├── session/route.ts  # Create chat session
│   │   │   ├── message/route.ts  # Send/receive messages
│   │   │   └── sessions/[userId]/route.ts # List sessions
│   │   └── legal/
│   │       ├── search/route.ts   # Search legal documents
│   │       └── categories/route.ts # Get categories
│   ├── chat/
│   │   └── page.tsx              # Chat interface page
│   ├── dashboard/
│   │   └── page.tsx              # User dashboard
│   ├── documents/
│   │   └── page.tsx              # Document templates
│   ├── legal-aid/
│   │   └── page.tsx              # Legal search/aid
│   ├── login/
│   │   └── page.tsx              # Login page
│   └── signup/
│       └── page.tsx              # Signup page
│
├── components/
│   ├── Navigation.tsx            # Top navigation bar
│   ├── ChatInterface.tsx         # Main chat component
│   ├── ChatMessage.tsx           # Individual message component
│   ├── ChatInput.tsx             # Message input with voice/files
│   ├── LegalSearch.tsx           # Legal document search
│   └── DocumentGenerator.tsx     # Document template generator
│
├── lib/
│   ├── services/
│   │   ├── rag.ts               # Document search & retrieval
│   │   ├── llm.ts               # AI response generation
│   │   ├── auth.ts              # User authentication & management
│   │   └── chat.ts              # Chat session management
│   └── utils/
│       └── (utility functions)
│
├── public/
│   └── data/
│       ├── indian_laws_en.json  # Legal documents corpus
│       ├── users.json           # User database
│       └── chats/               # Chat session files
│
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind CSS config
├── next.config.js              # Next.js config
└── .env.example                # Environment variables template
```

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm**, **yarn**, **pnpm**, or **bun**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SETHUPATHI2005/NyayaMithran.git
   cd NyayaMithran
   git checkout nyayamithran-nextjs-conversion
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Set up environment variables (optional):**
   ```bash
   cp .env.example .env.local
   # Add your API keys for enhanced LLM features (optional)
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

---

## Features

### 1. **AI Legal Chat Assistant**
- Ask legal questions in English or Hindi
- RAG-powered responses with relevant legal references
- Voice input support (Web Speech API)
- File attachment capability
- Chat history saved to local storage

### 2. **Legal Document Search**
- Search through Indian laws and acts
- Keyword-based + topic fallback search
- Categorized results
- Multiple language support

### 3. **Legal Document Generator**
- Pre-made templates:
  - Legal Complaints
  - Petitions
  - Affidavits
  - Legal Notice Letters
  - Agreements
  - Appeals
- Form-based generation
- Download as text files

### 4. **User Dashboard**
- View chat session history
- Statistics on questions asked
- Quick access to recent conversations

### 5. **Legal Aid Locator** (Future)
- Find nearby legal aid organizations
- Contact information
- Service areas

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Chat
- `POST /api/chat/session` - Create new chat session
- `POST /api/chat/message` - Send message & get response
- `GET /api/chat/sessions/:userId` - List user's chat sessions

### Legal Resources
- `GET /api/legal/search?q=query&lang=en` - Search legal documents
- `GET /api/legal/categories` - Get available categories & topics

---

## Services

### RAG Service (`lib/services/rag.ts`)
Retrieval-Augmented Generation for legal document search:
- Loads `indian_laws_en.json`
- Keyword extraction and similarity matching
- Category-based filtering
- Topic-based fallback for unmatched queries

### LLM Service (`lib/services/llm.ts`)
Generates legal guidance responses:
- Integrates with Hugging Face (optional)
- Falls back to template-based responses if API unavailable
- Supports multiple languages
- Entity extraction for laws, acts, etc.

### Auth Service (`lib/services/auth.ts`)
User authentication & management:
- PBKDF2 password hashing
- Token generation
- User registration & login
- Language preference management

### Chat Service (`lib/services/chat.ts`)
Session & message management:
- Creates isolated chat sessions per user
- Persists messages to file system
- Auto-titles conversations from first user message
- Session listing and deletion

---

## Environment Variables (Optional)

```env
# Hugging Face API for enhanced LLM responses
HUGGINGFACE_API_KEY=hf_your_api_key_here

# OpenAI API (future integration)
OPENAI_API_KEY=sk_your_api_key_here

# Node environment
NODE_ENV=development
```

**Note:** The app works without these APIs using fallback responses. Add them for enhanced functionality.

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Vercel auto-detects Next.js and configures everything
4. Set environment variables in Vercel Dashboard (if using external APIs)
5. Deploy with one click!

```bash
# Using Vercel CLI
npm install -g vercel
vercel
```

### Deploy to Other Platforms

**Docker:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**AWS Lambda / AWS EC2:**
- Next.js builds to `.next/` directory
- Run `npm run build && npm start`
- Works with serverless and traditional hosting

---

## Development

### Adding a New Page

1. Create `app/[section]/page.tsx`
2. Use client components with `'use client'` for interactivity
3. Import shared components from `components/`
4. Use services from `lib/services/`

### Adding a New API Endpoint

1. Create `app/api/[section]/[action]/route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` functions as needed
3. Use services for business logic
4. Return `NextResponse.json()` responses

### Adding a Service

1. Create `lib/services/[service].ts`
2. Export a singleton instance or class
3. Import and use in API routes or components

---

## Features Preserved from Original

✓ Multi-language support (English & Hindi)
✓ AI-powered legal guidance
✓ Document templates
✓ Legal resource search
✓ Voice input
✓ File attachments
✓ Chat history
✓ User authentication
✓ Responsive design

---

## Known Limitations & Future Work

- Chat history uses file system (consider database for production)
- LLM integration is optional (fallback templates available)
- Legal aid locator not yet implemented (map integration needed)
- No email verification for signups
- No advanced user settings/preferences UI
- Document download as .txt (could expand to PDF/Word)

---

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

---

## License

This project is open source and available under the MIT License.

---

## Support

For issues or questions:
- Create an issue on GitHub
- Check existing documentation
- Review the original FastAPI implementation for reference

---

## Acknowledgments

- Original NyayaMithran concept and design
- Indian legal documents from official government sources
- Community contributions and feedback

---

**Last Updated:** March 2026
**Conversion Status:** Complete - FastAPI → Next.js
**Version:** 2.0.0

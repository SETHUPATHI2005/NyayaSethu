# Running NyayaMithran Locally

## Prerequisites Check

Before running `npm install && npm run dev`, verify you have:

- **Node.js** (v18+): `node --version`
- **npm** (v9+): `npm --version`
- **Git**: `git --version`

## Step 1: Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign up (free)
2. Create a new project
3. Go to Settings → API
4. Copy:
   - `URL` → Paste as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → Paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: Run Database Migration

1. In Supabase dashboard, go to SQL Editor
2. Create new query
3. Copy entire contents of `scripts/001_create_tables.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify: You should see 3 new tables in the database section

## Step 3: Install Dependencies

```bash
npm install
```

This will:
- Install all dependencies listed in package.json
- Install Supabase client libraries
- Set up Next.js

**Time estimate:** 2-3 minutes

## Step 4: Run Development Server

```bash
npm run dev
```

You should see:

```
> next dev
  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 3.2s
```

## Step 5: Open the Application

Open your browser and go to: **http://localhost:3000**

You should see:
- Landing page with "NyayaMithran" title
- "Get Started" button
- Language selector (English/Hindi)
- Login and Sign Up buttons

## Testing the Application

### 1. Sign Up (Required)

1. Click "Sign Up" button
2. Enter:
   - **Name**: Your name
   - **Email**: A test email (e.g., test@example.com)
   - **Password**: At least 6 characters
   - **Language**: English or Hindi
3. Click "Create Account"

**Note**: Supabase will send a confirmation email. In development, you may see a message about email confirmation. You can bypass this for testing by checking Supabase documentation on disabling email confirmation.

### 2. Login

1. Click "Login"
2. Enter email and password from signup
3. You should be redirected to dashboard

### 3. Try Chat

1. From dashboard, click "Chat" or "Start Chatting"
2. Type a legal question, e.g.:
   - "What are my rights as a worker?"
   - "What is the Indian Penal Code?"
   - "How do I write a contract?"
3. Click send
4. You'll get an AI response based on legal documents

### 4. View Chat History

1. Go to Dashboard
2. You should see your chat session listed
3. Click on it to view the conversation

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "NEXT_PUBLIC_SUPABASE_URL is not set"

**Solution:**
- Verify `.env.local` file exists in project root
- Check that environment variables are set correctly
- No quotes needed around values in .env.local
- Example:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
  ```

### Issue: Cannot connect to Supabase

**Solution:**
1. Verify Supabase project is created and active
2. Check API keys are correct (copy from Settings → API)
3. Ensure database migration script was executed
4. Try in incognito/private browser window

### Issue: "RLS policy denied" errors

**Solution:**
- Run the migration script again
- Check that `scripts/001_create_tables.sql` completed without errors
- Clear browser cache and try again

### Issue: Port 3000 already in use

**Solution:**
```bash
# Use a different port
npm run dev -- -p 3001
```

Then visit: http://localhost:3001

---

## Project Structure

Once running, here's what you have:

```
/vercel/share/v0-project/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Landing page
│   ├── chat/page.tsx            # Chat interface
│   ├── dashboard/page.tsx       # User dashboard
│   ├── documents/page.tsx       # Document templates
│   ├── legal-aid/page.tsx       # Legal search
│   ├── auth/                    # Authentication pages
│   ├── api/                     # API routes
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/                  # React components
│   ├── Navigation.tsx
│   ├── ChatInterface.tsx
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── LegalSearch.tsx
│   └── DocumentGenerator.tsx
├── lib/                         # Utilities and services
│   ├── supabase/               # Supabase clients
│   └── services/               # Business logic
├── public/                      # Static files
│   └── data/                   # Legal documents
├── scripts/                    # Database migrations
├── package.json               # Dependencies
├── next.config.js            # Next.js config
├── tailwind.config.js        # Tailwind config
└── tsconfig.json            # TypeScript config
```

---

## Common Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Format code
npm run format

# Type checking
npm run type-check
```

---

## Next Steps After Running Locally

### If Everything Works ✓
1. Test all pages (chat, dashboard, documents, search)
2. Test signup and login
3. Send chat messages
4. Generate documents

### To Deploy to Vercel
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### To Customize
1. Edit components in `/components`
2. Modify pages in `/app`
3. Update styles in `app/globals.css`
4. Add more legal documents in `public/data/`

---

## Documentation References

Need more help?

- **Full Setup Guide**: Read `SETUP_GUIDE.md`
- **Architecture Details**: Read `MIGRATION_SUMMARY.md`
- **Feature Overview**: Read `README.md`
- **Quick Start**: Read `QUICKSTART.md`

---

## Support

If you encounter issues:

1. Check the error message in the terminal
2. Look for matching error in "Troubleshooting" section above
3. Review relevant documentation file
4. Check Supabase logs (Supabase Dashboard → Logs)

---

**You're ready to run NyayaMithran! Execute: `npm install && npm run dev`**

# NyayaMithran - Complete Setup Guide

This guide will walk you through setting up NyayaMithran with Supabase database for full functionality.

## Step 1: Supabase Project Setup

### 1.1 Create a Supabase Account
- Go to https://supabase.com
- Click "Sign Up" and complete the registration
- Verify your email address

### 1.2 Create a New Project
- Click "New Project"
- Fill in the project details:
  - **Name**: NyayaMithran (or your choice)
  - **Password**: Create a secure password
  - **Region**: Choose closest to your users (e.g., Asia Pacific for India)
  - **Pricing Plan**: Free tier is sufficient for development

### 1.3 Wait for Project Creation
- The project initialization takes a few minutes
- You'll see a loading screen with progress indicators
- Once complete, you'll be redirected to the project dashboard

---

## Step 2: Get Your Credentials

### 2.1 Access API Credentials
1. In the Supabase dashboard, go to **Project Settings** (gear icon)
2. Click **API** in the sidebar
3. You'll see:
   - **Project URL** - Copy this (looks like: `https://xxxxx.supabase.co`)
   - **anon public** - Copy the public key under "Project API keys"

### 2.2 Note Down Credentials
Copy these values somewhere safe - you'll need them in the next step:
```
Project URL: https://xxxxx.supabase.co
Anon Key: eyJhbGc...xxxxxxx
```

---

## Step 3: Configure Your Local Environment

### 3.1 Create Environment File
In the project root directory, create a file named `.env.local`:

```bash
touch .env.local
```

### 3.2 Add Supabase Credentials
Open `.env.local` and paste:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...xxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Replace:
- `https://xxxxx.supabase.co` with your actual Project URL
- `eyJhbGc...xxxxxxx` with your actual Anon Key

### 3.3 Save the File
The file should be in the root of your project (same level as `package.json`)

---

## Step 4: Run Database Migrations

### 4.1 Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### 4.2 Create Tables
1. Copy all the SQL from `scripts/001_create_tables.sql`
2. Paste it into the SQL Editor
3. Click **Run** (execute button)

Expected output:
```
Success. No rows returned.
```

### 4.3 Verify Tables Were Created
- Click **Table Editor** in the left sidebar
- You should see three new tables:
  - `profiles`
  - `chat_sessions`
  - `chat_messages`

---

## Step 5: Install Dependencies

### 5.1 Install Node Packages
```bash
npm install
```

Or with yarn:
```bash
yarn install
```

Or with pnpm:
```bash
pnpm install
```

This installs all required dependencies including:
- `@supabase/supabase-js` - Supabase client library
- `@supabase/ssr` - Server-side rendering support
- Next.js, React, Tailwind CSS, and others

---

## Step 6: Run the Development Server

### 6.1 Start Dev Server
```bash
npm run dev
```

Expected output:
```
> next dev

  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 2.3s
```

### 6.2 Access the Application
Open your browser and go to: http://localhost:3000

You should see:
- Landing page with NyayaMithran title
- Login and Sign Up buttons
- Feature highlights

---

## Step 7: Test Authentication

### 7.1 Create a Test Account
1. Click **Sign Up** button
2. Fill in:
   - **Email**: your-email@example.com
   - **Password**: At least 6 characters
3. Click **Sign Up**

### 7.2 Verify Email (Development)
In development mode, Supabase sends a confirmation email:
1. Check your email inbox
2. Look for an email from Supabase
3. Click the confirmation link in the email
4. You'll be redirected back to the app

**Note:** Check spam/promotions folder if not in inbox

### 7.3 Login
1. Go to Login page (http://localhost:3000/auth/login)
2. Enter your email and password
3. Click **Login**

You should be redirected to the **Dashboard**

---

## Step 8: Test Features

### 8.1 Chat Interface
1. From Dashboard, click **Chat** or go directly to http://localhost:3000/chat
2. Start typing a legal question:
   - "What is the Indian Penal Code?"
   - "What are my rights as an employee?"
3. Click **Send** or press Enter
4. You should see an AI response with relevant legal information

### 8.2 Legal Search
1. Go to http://localhost:3000/legal-aid
2. Search for legal topics:
   - "contract"
   - "employment"
   - "property"
3. Results should appear from the legal documents database

### 8.3 Document Generator
1. Go to http://localhost:3000/documents
2. Click on a document template
3. Fill in the form fields
4. Click **Generate Document**
5. You should see the generated document with a **Download** button

### 8.4 Dashboard
1. Go to http://localhost:3000/dashboard
2. You should see:
   - Number of chat sessions
   - Total questions asked
   - Join date
   - Recent conversations

---

## Troubleshooting

### Problem: "NEXT_PUBLIC_SUPABASE_URL is not set"

**Solution:**
1. Check `.env.local` exists in project root
2. Verify the variables are correct (no extra spaces or quotes)
3. Stop dev server (Ctrl+C) and restart: `npm run dev`

### Problem: "Email confirmation link not working"

**Solution:**
1. Make sure `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`
2. Check the email link includes your local URL
3. If using production URL, update this variable accordingly

### Problem: "Authentication fails with error"

**Solution:**
1. Go to Supabase dashboard → Authentication → Providers
2. Verify "Email Auth" is enabled (should be by default)
3. Check that "Email confirmations" is set to "Disabled" for development (if you want instant access)

### Problem: "Chat messages not saving"

**Solution:**
1. Check you're logged in (look for your email in top navigation)
2. Open browser console (F12) and look for error messages
3. Verify RLS policies are enabled in Supabase (all should be by default from migration)

### Problem: "Can't login with a previously created account"

**Solution:**
1. Go to Supabase dashboard → Authentication → Users
2. Find your account - it should say "Email Confirmed: Yes"
3. If not confirmed, click the three dots → Force confirm email

---

## Production Deployment

### Option A: Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com and import your repository
3. Add environment variables:
   - Click **Environment Variables**
   - Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain
4. Click **Deploy**
5. Update Supabase email settings:
   - Go to Authentication → Email Templates
   - Change confirmation links to your Vercel domain

### Option B: Deploy to Other Platforms

For AWS, Google Cloud, Azure, or self-hosted:
1. Build: `npm run build`
2. Start: `npm run start`
3. Set same environment variables
4. Update Supabase with your production domain

---

## Next Steps

1. **Customize** - Modify colors, text, and features
2. **Add LLM Integration** - Connect to OpenAI or Hugging Face (optional)
3. **Deploy** - Push to production
4. **Monitor** - Set up logging and monitoring
5. **Scale** - Add more features based on user feedback

---

## Support

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Review Supabase documentation: https://supabase.com/docs
3. Check Next.js documentation: https://nextjs.org/docs
4. Open an issue on GitHub with error details

---

## Security Notes

- Never commit `.env.local` to Git (it's in `.gitignore`)
- Keep your Supabase keys private
- For production, use environment variables from your deployment platform
- Regularly rotate your API keys in Supabase dashboard
- Monitor your Supabase usage to avoid unexpected charges

Happy coding! 🚀

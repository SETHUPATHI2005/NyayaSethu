# NyayaMithran - Quick Start (5 Minutes)

Get NyayaMithran running locally in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- Supabase account (free at https://supabase.com)

## Step 1: Supabase Setup (2 minutes)

1. **Create Supabase Project**
   - Go to https://supabase.com → Sign In
   - Click "New Project"
   - Fill details and wait for creation

2. **Get Credentials**
   - Go to Project Settings → API
   - Copy the **Project URL**
   - Copy the **Anon Key** (under "Project API keys")

## Step 2: Local Setup (2 minutes)

1. **Clone & Install**
   ```bash
   git clone https://github.com/SETHUPATHI2005/NyayaMithran.git
   cd NyayaMithran
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=<paste-your-project-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-your-anon-key>
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Run Database Migration**
   - Open Supabase SQL Editor
   - Copy-paste contents of `scripts/001_create_tables.sql`
   - Click "Run"

## Step 3: Run & Test (1 minute)

1. **Start Dev Server**
   ```bash
   npm run dev
   ```

2. **Open in Browser**
   - Go to http://localhost:3000
   - Click "Sign Up"
   - Enter email & password
   - Confirm email (check inbox)
   - Click "Chat" to start using!

## That's It! 🎉

### What's Working Now:
- ✅ User authentication with Supabase
- ✅ Chat interface with persistent storage
- ✅ Legal document search
- ✅ Dashboard with statistics
- ✅ Multi-language support (English/Hindi)

### Common Tasks:
| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Build for prod | `npm run build` |
| Run production | `npm run start` |
| Run linter | `npm run lint` |

### Important Files:
- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup
- `MIGRATION_SUMMARY.md` - Architecture changes
- `.env.local` - Your configuration

### Troubleshooting:
1. **Can't login?** → Check `.env.local` has correct URLs
2. **Email not confirming?** → Check email spam folder
3. **Chat not working?** → Restart dev server (`npm run dev`)
4. **Database error?** → Run migration SQL again

### Next Steps:
1. Read `README.md` for full features
2. Check `SETUP_GUIDE.md` for detailed instructions
3. Deploy to Vercel for free: https://vercel.com/import

---

**Need help?** Check the detailed guides or Supabase docs at https://supabase.com/docs

Happy coding! 🚀

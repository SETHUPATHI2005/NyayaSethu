# Pre-Launch Checklist

Complete this checklist before running `npm install && npm run dev`

## Environment Setup

- [ ] **Node.js Installed** - `node --version` shows v18+
- [ ] **npm Installed** - `npm --version` shows v9+
- [ ] **Git Installed** - `git --version` works
- [ ] **.env.local Created** - File exists in project root
- [ ] **Supabase URL Set** - `NEXT_PUBLIC_SUPABASE_URL` in .env.local
- [ ] **Supabase Key Set** - `NEXT_PUBLIC_SUPABASE_ANON_KEY` in .env.local
- [ ] **Site URL Set** - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

## Database Setup

- [ ] **Supabase Project Created** - Free project at supabase.com
- [ ] **Database Migration Run** - SQL from `scripts/001_create_tables.sql` executed
- [ ] **3 Tables Created** - Verify in Supabase:
  - [ ] `profiles` table exists
  - [ ] `chat_sessions` table exists
  - [ ] `chat_messages` table exists

## Project Files

- [ ] **package.json** - Exists in root directory
- [ ] **tsconfig.json** - TypeScript config present
- [ ] **next.config.js** - Next.js config present
- [ ] **tailwind.config.js** - Tailwind config present
- [ ] **app/layout.tsx** - Root layout exists
- [ ] **app/page.tsx** - Home page exists
- [ ] **lib/services/** - Services folder populated
- [ ] **components/** - Components folder populated

## Documentation Review (Optional but Recommended)

- [ ] Read **RUN_LOCALLY.md** (just created - for running locally)
- [ ] Skimmed **START_HERE.md** (quick overview)
- [ ] Bookmarked **SETUP_GUIDE.md** (for detailed help)

---

## Launch Commands

Once all items above are checked, run these commands:

### Command 1: Install Dependencies
```bash
npm install
```
- Wait for completion
- No errors should appear
- Should take 2-3 minutes

### Command 2: Run Development Server
```bash
npm run dev
```
- Should see "✓ Ready in X.Xs"
- Should see "Local: http://localhost:3000"
- No errors in terminal

### Command 3: Open Browser
```
http://localhost:3000
```
- Should load landing page
- Should see "NyayaMithran" title
- Should see navigation buttons

---

## Post-Launch Testing

Once the app is running at http://localhost:3000:

### Test 1: Homepage
- [ ] Landing page loads
- [ ] "Get Started" button visible
- [ ] Language selector works
- [ ] Login/Signup buttons work

### Test 2: Sign Up
- [ ] Can navigate to signup page
- [ ] Can fill in name, email, password
- [ ] Can select language
- [ ] Can submit form

### Test 3: Login
- [ ] Can navigate to login page
- [ ] Can enter email and password
- [ ] Can submit form

### Test 4: Dashboard (After Login)
- [ ] Dashboard loads
- [ ] Can see user greeting
- [ ] Navigation menu works
- [ ] Can logout

### Test 5: Chat
- [ ] Can access chat page
- [ ] Can type message
- [ ] Can send message
- [ ] Can see response

### Test 6: Documents
- [ ] Documents page loads
- [ ] Can see document templates
- [ ] Can click to generate

### Test 7: Legal Search
- [ ] Search page loads
- [ ] Can search for legal topics
- [ ] Can see results

---

## If Something Breaks

**Error in Terminal?**
1. Read the error message carefully
2. Check if it matches any in `RUN_LOCALLY.md` Troubleshooting
3. Try the suggested fix
4. If still broken, check environment variables

**Page Won't Load?**
1. Check browser console (F12)
2. Look for error messages
3. Check terminal for API errors
4. Verify .env.local is set correctly

**Database Issues?**
1. Verify Supabase project exists
2. Check SQL migration ran successfully
3. Verify 3 tables were created
4. Check API keys are correct

**Still Stuck?**
1. Review `SETUP_GUIDE.md` for detailed help
2. Check `MIGRATION_SUMMARY.md` for architecture
3. Read through `RUN_LOCALLY.md` troubleshooting

---

## Success Criteria

You're done when you can:

✓ Run `npm run dev` without errors  
✓ Access http://localhost:3000 in browser  
✓ See the NyayaMithran landing page  
✓ Sign up with an email account  
✓ Log in with your credentials  
✓ View the dashboard  
✓ Send a message in the chat  
✓ Receive a response  
✓ See your chat in history  
✓ Access other pages (documents, legal search)

---

## Next Steps

Once everything is working:

### Option A: Continue Development
- Make code changes
- Hot reload automatically works
- Test changes in browser
- Use guide: `SETUP_GUIDE.md`

### Option B: Deploy to Production
- Push code to GitHub
- Connect to Vercel
- Add environment variables
- Deploy with one click

### Option C: Customize for Your Needs
- Edit components in `/components`
- Add more legal documents
- Customize UI in `app/globals.css`
- Extend functionality in services

---

## Quick Reference

| What | Command |
|------|---------|
| Install deps | `npm install` |
| Start dev server | `npm run dev` |
| Build for prod | `npm run build` |
| Run prod build | `npm start` |
| Open app | http://localhost:3000 |
| Stop server | Ctrl+C in terminal |

---

**Ready? Execute: `npm install && npm run dev`**

Then open: http://localhost:3000

Good luck! 🚀

# Quick Start Guide - Vercel Deployment

**Status**: Database connected ✅ | 95% Ready to Deploy

---

## Current Status

Your repository is **almost ready** for production deployment! Here's what's done:

✅ **Database Connected** - Vercel Postgres configured
✅ **Authentication Set** - NextAuth.js configured
✅ **Build Optimized** - vercel.json and configurations added
✅ **Node Version Fixed** - Aligned to 20.x
✅ **API Routes Configured** - All serverless functions ready

---

## 3-Step Deployment Process

### Step 1: Verify Environment Variables (5 minutes)

Check that these are set in **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**:

**Required:**
- [x] `DATABASE_URL` ✅
- [x] `NEXTAUTH_SECRET` ✅
- [x] `NEXTAUTH_URL` ✅
- [x] `GOOGLE_CLIENT_ID` ✅
- [ ] `GOOGLE_CLIENT_SECRET` ⚠️ **Verify this is set**
- [ ] `ANTHROPIC_API_KEY` ⚠️ **Verify this is set**

**Optional (for payments):**
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

**To verify:**
```bash
# View all environment variables in Vercel Dashboard
# Or check with CLI:
vercel env ls
```

---

### Step 2: Initialize Database (5 minutes)

Since no migrations directory exists yet, you need to initialize the database schema.

**Option A: Automatic (Recommended)**

The database will be initialized automatically on first deployment via the build command in `vercel.json`.

**Option B: Manual (if you want to initialize now)**

```bash
# Pull production environment variables
vercel env pull .env.production

# Create initial migration
npx prisma migrate dev --name init

# Or use the provided script
./scripts/init-database.sh

# Push migration to Vercel database
npx prisma migrate deploy
```

**To verify database is ready:**
```bash
npx prisma studio
# Opens a browser with your database contents
```

---

### Step 3: Update Google OAuth & Deploy (5 minutes)

#### 3a. Update OAuth Redirect URIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client
3. Add these Authorized redirect URIs:
   ```
   https://your-actual-domain.vercel.app/api/auth/callback/google
   https://*.vercel.app/api/auth/callback/google
   ```
4. Save

**Find your Vercel domain:**
- Check Vercel Dashboard → Your Project → Domains
- Or use: `https://[your-project-name].vercel.app`

#### 3b. Deploy

**Option A: Merge to Main (Automatic Deployment)**
```bash
git checkout main
git merge claude/vercel-deployment-analysis-01KwN6W6zpmzanZG9CA11Zir
git push origin main
# Vercel automatically deploys main branch
```

**Option B: Deploy Current Branch**
```bash
# Deploy to production
vercel --prod

# Or deploy preview first
vercel
```

**Option C: Via Vercel Dashboard**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments" → "Deploy"
4. Or merge PR from GitHub

---

## Post-Deployment Testing (5 minutes)

Once deployed, test these in order:

### 1. Basic Access
```bash
# Replace with your actual domain
curl https://your-domain.vercel.app
# Should return HTML
```

### 2. Authentication
Visit: `https://your-domain.vercel.app/auth/signin`
- ✅ Sign-in page loads
- ✅ Click "Sign in with Google"
- ✅ OAuth flow completes
- ✅ Redirects back to app
- ✅ User is signed in

### 3. API Endpoints
```bash
# Test session endpoint
curl https://your-domain.vercel.app/api/auth/session

# Test hello endpoint
curl https://your-domain.vercel.app/api/hello
```

### 4. Core Features
1. Navigate to `/generator`
2. Create a lesson plan
3. Verify it saves (check Prisma Studio or database)
4. Export to PDF
5. Export to DOCX

---

## Troubleshooting

### "Google OAuth error: redirect_uri_mismatch"
**Fix**: Update Google Cloud Console redirect URIs with your actual Vercel domain.

### "Database connection error"
**Fix**: Run migrations:
```bash
vercel env pull .env.production
npx prisma migrate deploy
```

### "ANTHROPIC_API_KEY is not configured"
**Fix**: Add to Vercel environment variables:
1. Dashboard → Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY` = `sk-ant-...`
3. Redeploy

### Build fails
**Check**:
1. View logs in Vercel Dashboard → Deployments → [Your deployment] → Logs
2. Ensure all environment variables are set
3. Verify DATABASE_URL is correct

---

## Verification Checklist

After deployment, check:

- [ ] Homepage loads without errors
- [ ] Sign in with Google works
- [ ] User data persists in database
- [ ] Can access `/generator` when signed in
- [ ] Can create lesson plans
- [ ] Lesson plans save to database
- [ ] Can export to PDF
- [ ] Can export to DOCX
- [ ] No errors in browser console
- [ ] No errors in Vercel function logs

---

## Useful Commands

```bash
# View deployment status
vercel ls

# Check environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local

# View logs
vercel logs --follow

# Open Prisma Studio
npx prisma studio

# Check database migration status
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Redeploy current deployment
vercel --prod
```

---

## Database Management

### View Database
```bash
npx prisma studio
# Opens at http://localhost:5555
```

### Check Schema Sync
```bash
npx prisma db pull
# Pulls current database schema

npx prisma db push
# Pushes schema changes (use carefully in production!)
```

### Backup Database
```bash
# Via Vercel Dashboard
# Storage → Your Database → Backups

# Or export data
npx prisma studio
# Export data manually
```

---

## Performance Monitoring

### Vercel Analytics
Already integrated! View in:
- Vercel Dashboard → Analytics

### Function Logs
- Vercel Dashboard → Deployments → [Deployment] → Functions

### Database Performance
- Vercel Dashboard → Storage → [Database] → Metrics

---

## Security Notes

✅ **Already secured:**
- All secrets in environment variables
- No credentials in git
- HTTPS enforced
- Database connection secured

🔒 **Recommended additions:**
- Rate limiting on API routes
- CORS configuration
- CSP headers
- Input validation
- SQL injection protection (Prisma handles this)

---

## Cost Tracking

Monitor usage in Vercel Dashboard:
- **Bandwidth**: Dashboard → Usage
- **Function Execution**: Dashboard → Usage → Functions
- **Database**: Storage → [Database] → Usage

**Current setup:**
- Platform: ~$40/month (Pro + Postgres)
- API calls: Pay per use
- No egress fees for standard usage

---

## Getting Help

### Documentation
- Main guide: `VERCEL_DEPLOYMENT_GUIDE.md`
- Detailed status: `DEPLOYMENT_STATUS.md`
- Quick reference: `DEPLOYMENT_CHECKLIST.md`

### Official Resources
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- NextAuth: https://next-auth.js.org/

### Check Logs
```bash
# Deployment logs
vercel logs <deployment-url>

# Real-time logs
vercel logs --follow

# Function logs
# Vercel Dashboard → Functions → [Function] → Logs
```

---

## Summary

**You're 95% ready to deploy!**

**Remaining tasks:**
1. ⚠️ Verify `GOOGLE_CLIENT_SECRET` and `ANTHROPIC_API_KEY` in Vercel
2. 🔄 Initialize database (auto on first deploy, or run manually)
3. 🔗 Update Google OAuth redirect URIs with production domain
4. 🚀 Deploy!

**Estimated time to production: 15-20 minutes**

---

**Ready to deploy?** Run:
```bash
vercel --prod
```

Then follow the Post-Deployment Testing checklist above. 🎉

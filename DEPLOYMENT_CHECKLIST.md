# Vercel Deployment Quick Checklist

## Pre-Deployment Setup

### 1. Database Setup
- [ ] Provision PostgreSQL database (Vercel Postgres recommended)
- [ ] Get DATABASE_URL connection string
- [ ] Test database connection locally

### 2. Environment Variables Required

Copy these to Vercel Dashboard → Settings → Environment Variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# NextAuth.js
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Google OAuth (create at console.cloud.google.com)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Provider
ANTHROPIC_API_KEY="sk-ant-..."

# Stripe (optional, if using payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### 3. Google OAuth Setup
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create OAuth 2.0 Client ID
- [ ] Add authorized redirect URIs:
  - `https://your-domain.vercel.app/api/auth/callback/google`
  - `https://*.vercel.app/api/auth/callback/google`
- [ ] Copy Client ID and Secret to environment variables

### 4. Generate Secrets
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

## Deployment Steps

### Option A: Vercel Dashboard (Recommended)

1. **Connect Repository**
   - [ ] Go to [vercel.com/new](https://vercel.com/new)
   - [ ] Import your GitHub repository
   - [ ] Select repository: `SAHearn1/RWFW_Lesson_Plan_Generator`

2. **Configure Project**
   - [ ] Framework Preset: Next.js (auto-detected)
   - [ ] Root Directory: `./`
   - [ ] Build Command: `prisma generate && prisma migrate deploy && next build`
   - [ ] Output Directory: `.next` (auto-detected)
   - [ ] Install Command: `npm install`

3. **Add Environment Variables**
   - [ ] Add all variables from section 2 above
   - [ ] Set for: Production, Preview, Development

4. **Deploy**
   - [ ] Click "Deploy"
   - [ ] Wait for build to complete (~3-5 minutes)

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Post-Deployment Verification

### 1. Check Build Success
- [ ] Build completed without errors
- [ ] View build logs in Vercel Dashboard

### 2. Test Deployment
- [ ] Visit deployment URL: `https://your-project.vercel.app`
- [ ] Homepage loads correctly
- [ ] Test sign-in: `/auth/signin`
- [ ] Verify authentication flow
- [ ] Test lesson plan generation

### 3. Verify API Endpoints
- [ ] `/api/auth/session` - Returns session data
- [ ] `/api/hello` - Test endpoint works
- [ ] `/api/lessons` - Create lesson plan (requires auth)

### 4. Database Verification
- [ ] User data persists after sign-in
- [ ] Lesson plans save to database
- [ ] Sessions work correctly

### 5. Update OAuth Settings
- [ ] Add actual Vercel domain to Google OAuth allowed redirect URIs
- [ ] Test OAuth flow with production domain

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify all environment variables are set
- Ensure DATABASE_URL is correct

### Authentication Issues
- Verify NEXTAUTH_SECRET is set
- Check Google OAuth credentials
- Confirm callback URLs match in Google Console
- Ensure NEXTAUTH_URL matches your domain

### Database Connection Fails
- Test DATABASE_URL connection string
- Check database allows connections from Vercel
- Verify database is running
- Run migrations: `npx prisma migrate deploy`

### API Routes Return 404
- Check route files exist in `src/app/api/`
- Verify no middleware blocking routes
- Ensure `output: 'export'` is NOT in next.config.js

## Optional Enhancements

### Custom Domain
1. [ ] Go to Vercel Dashboard → Settings → Domains
2. [ ] Add your custom domain
3. [ ] Follow DNS configuration instructions
4. [ ] Update NEXTAUTH_URL environment variable
5. [ ] Update Google OAuth redirect URIs

### Monitoring
- [ ] Enable Vercel Analytics (already integrated)
- [ ] Setup error tracking (Sentry recommended)
- [ ] Configure uptime monitoring

### Performance
- [ ] Enable Vercel Speed Insights
- [ ] Setup Prisma Accelerate for faster queries
- [ ] Configure database connection pooling

### Security
- [ ] Setup rate limiting on API routes
- [ ] Configure CORS headers
- [ ] Add CSP headers
- [ ] Enable Vercel Web Application Firewall

## Quick Commands Reference

```bash
# View deployment logs
vercel logs <deployment-url>

# Pull environment variables locally
vercel env pull .env.local

# Run database migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Check deployment status
vercel ls

# Inspect deployment
vercel inspect <deployment-url>
```

## Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Prisma on Vercel**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
- **NextAuth.js**: https://next-auth.js.org/deployment
- **Full Guide**: See `VERCEL_DEPLOYMENT_GUIDE.md`

---

**Estimated Setup Time**: 30-45 minutes
**Status**: Ready for deployment ✅

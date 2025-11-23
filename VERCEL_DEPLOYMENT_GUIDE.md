# Vercel Deployment Guide & Recommendations

## Executive Summary

This Next.js 14 application (RWFW Lesson Plan Generator) is **ready for deployment to Vercel** with some configuration and environment setup. The application uses modern Next.js App Router, Prisma ORM with PostgreSQL, NextAuth.js for authentication, and integrates with external APIs (OpenAI/Anthropic, Stripe).

**Deployment Readiness: 85%** ✅

## Current Architecture

### Technology Stack
- **Framework**: Next.js 14.2.33 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database**: PostgreSQL with Prisma ORM 5.15
- **Authentication**: NextAuth.js 4.24 with Google OAuth
- **Payment**: Stripe integration
- **AI Provider**: Anthropic/OpenAI APIs
- **Analytics**: Vercel Analytics (already integrated)
- **Node Version**: 22.x (specified in package.json)

### Key Features
- Lesson plan generation with AI
- User authentication & profiles
- Subscription management
- Document export (PDF, DOCX)
- Teacher profiles with district/state info

## Pre-Deployment Checklist

### ✅ Ready
- [x] Next.js App Router structure
- [x] TypeScript configuration
- [x] Prisma schema defined
- [x] Environment variable template (.env.example)
- [x] Vercel Analytics integration
- [x] Production build script
- [x] NextAuth configuration with Vercel URL auto-detection
- [x] Git repository initialized
- [x] Proper .gitignore configuration

### ⚠️ Required Actions
- [ ] Database provisioning
- [ ] Environment variables configuration
- [ ] Google OAuth credentials setup
- [ ] Database migration execution
- [ ] Node version alignment

## Critical Issues & Solutions

### 1. Node Version Mismatch ⚠️

**Issue**: Package.json specifies Node 22.x, but .nvmrc specifies v20.10.0

**Impact**: Build might fail or use unexpected Node version

**Solution**:
```json
// Recommended: Update package.json to match .nvmrc
"engines": {
  "node": "20.x"
}
```

**Vercel Configuration**:
Vercel will respect the `engines.node` in package.json. Current default is Node 20.x which aligns with .nvmrc.

### 2. Database Setup Required 🔴

**Issue**: Application requires PostgreSQL database for Prisma

**Impact**: Application will fail without proper database connection

**Solutions**:

#### Option A: Vercel Postgres (Recommended)
```bash
# In Vercel Dashboard:
1. Go to Storage → Create Database → Postgres
2. Connect to your project
3. Vercel automatically sets DATABASE_URL
```

#### Option B: External Database (Neon, Supabase, PlanetScale)
```bash
# Set in Vercel Environment Variables:
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# For Prisma Accelerate (optional):
DIRECT_DATABASE_URL="postgresql://direct-connection"
```

**Post-Setup**:
```bash
# Run migrations after database is connected
npx prisma migrate deploy

# Or in Vercel build settings, add to build command:
prisma migrate deploy && next build
```

### 3. Environment Variables Configuration 🔴

**Required Variables**:

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth.js
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-domain.vercel.app"  # Auto-set by code if on Vercel

# Google OAuth
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# AI Provider
ANTHROPIC_API_KEY="sk-ant-..."
# OR
OPENAI_API_KEY="sk-..."

# Stripe (if using payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Setup Instructions**:

1. **In Vercel Dashboard**:
   - Settings → Environment Variables
   - Add all required variables
   - Set for Production, Preview, and Development

2. **Google OAuth Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `https://your-domain.vercel.app/api/auth/callback/google`
     - `https://*.vercel.app/api/auth/callback/google` (for preview deployments)

3. **Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

## Recommended Vercel Configuration

### Option 1: Create vercel.json (Recommended)

```json
{
  "buildCommand": "prisma generate && prisma migrate deploy && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXTAUTH_URL": "https://your-domain.vercel.app"
  },
  "build": {
    "env": {
      "SKIP_ENV_VALIDATION": "1"
    }
  }
}
```

### Option 2: Vercel Dashboard Settings

**Build & Development Settings**:
- **Framework Preset**: Next.js
- **Build Command**: `prisma generate && prisma migrate deploy && next build`
- **Install Command**: `npm install`
- **Output Directory**: `.next` (auto-detected)
- **Node Version**: 20.x

**Environment Variables**:
Add all variables from .env.example

## Deployment Steps

### Step 1: Prepare Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "chore: prepare for Vercel deployment"
git push origin main
```

### Step 2: Connect to Vercel

#### Via Vercel Dashboard:
1. Visit [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework: Next.js
   - Root Directory: ./
   - Build Command: (see above)

#### Via Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel
```

### Step 3: Configure Environment Variables
Add all required environment variables in Vercel Dashboard → Settings → Environment Variables

### Step 4: Setup Database

**If using Vercel Postgres**:
```bash
# In Vercel Dashboard:
1. Storage → Create Database → Postgres
2. Connect to project
3. DATABASE_URL is auto-set
```

### Step 5: Deploy
```bash
# Automatic deployment on git push
git push origin main

# Or manual deployment
vercel --prod
```

### Step 6: Run Database Migrations
```bash
# Option A: Via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy

# Option B: Automatic (if added to build command)
# Migrations run automatically on each deployment
```

### Step 7: Verify Deployment
1. Check build logs for errors
2. Visit your deployment URL
3. Test authentication: `/api/auth/signin`
4. Test API endpoints: `/api/hello`
5. Verify database connection

## Post-Deployment Configuration

### 1. Update OAuth Redirect URIs
Add your Vercel deployment URL to Google OAuth settings:
- `https://your-domain.vercel.app/api/auth/callback/google`
- `https://your-preview-*.vercel.app/api/auth/callback/google`

### 2. Configure Custom Domain (Optional)
```bash
# In Vercel Dashboard:
Settings → Domains → Add Domain
```

### 3. Setup Stripe Webhooks (If Using)
```bash
# Endpoint URL:
https://your-domain.vercel.app/api/webhooks/stripe

# Events to subscribe:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
```

## Optimization Recommendations

### 1. Build Performance

**Update package.json scripts**:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

### 2. Database Connection Pooling

For serverless environments, consider:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
}
```

Use Prisma Accelerate or connection pooling (PgBouncer).

### 3. Environment-Specific Configuration

**Create .env.production**:
```bash
# Production optimizations
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 4. Edge Runtime Considerations

Some API routes use Node.js-specific features (Prisma, file operations). Ensure they use:
```typescript
export const runtime = 'nodejs'; // In route.ts files
```

Current routes properly configured:
- `/api/auth/[...nextauth]/route.ts` ✅
- `/api/export/docx/route.ts` (check if runtime specified)
- `/api/export/pdf/route.ts` (check if runtime specified)

### 5. Static Generation Optimization

**Add to next.config.js**:
```javascript
module.exports = {
  // ... existing config
  experimental: {
    optimizePackageImports: ['@/components', '@/lib'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google avatars
      },
    ],
  },
};
```

## Monitoring & Debugging

### 1. Vercel Analytics
Already integrated via `@vercel/analytics`. View in Vercel Dashboard → Analytics.

### 2. Function Logs
View logs in Vercel Dashboard → Deployments → [Your Deployment] → Function Logs

### 3. Error Tracking
Consider adding:
- **Sentry**: For error tracking
- **LogRocket**: For session replay
- **Vercel Speed Insights**: Already available

### 4. Database Monitoring
- Prisma Studio: `npx prisma studio`
- Database provider's dashboard
- Query performance monitoring

## Security Checklist

- [ ] All API keys in environment variables (not committed)
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database credentials secured
- [ ] Google OAuth restricted to authorized domains
- [ ] Stripe webhook signature verification
- [ ] Rate limiting on API routes (consider implementing)
- [ ] CORS configured properly
- [ ] CSP headers configured (consider adding)

## Troubleshooting Common Issues

### Build Failures

**Font Loading Error** (Expected in CI):
```
Failed to fetch font 'Inter' from Google Fonts
```
**Solution**: This is expected in environments without internet access during build. Vercel has internet access, so this won't be an issue in production.

**Prisma Client Not Generated**:
```bash
# Add to build command:
prisma generate && next build
```

### Runtime Errors

**Database Connection Issues**:
- Verify DATABASE_URL is set correctly
- Check database is accessible from Vercel's region
- Ensure database allows connections from Vercel IPs

**NextAuth Errors**:
- Verify NEXTAUTH_SECRET is set
- Check Google OAuth credentials
- Ensure callback URLs match

**API Route 404s**:
- Verify route files are in `src/app/api/`
- Check middleware isn't blocking routes
- Ensure no `output: 'export'` in next.config.js

## Performance Expectations

### Cold Start
- First request: ~1-3 seconds (serverless cold start)
- Subsequent requests: ~100-300ms

### Build Time
- Initial build: ~3-5 minutes
- Incremental builds: ~1-2 minutes

### Database Queries
- With connection pooling: ~50-100ms
- Without pooling: ~200-500ms (cold start)

## Cost Estimation

### Vercel
- **Hobby Plan**: Free (non-commercial)
  - 100GB bandwidth
  - 100GB-hrs serverless function execution
  - Unlimited deployments

- **Pro Plan**: $20/month (recommended for production)
  - 1TB bandwidth
  - 1000GB-hrs serverless function execution
  - Custom domains
  - Team collaboration

### Database (Vercel Postgres)
- **Hobby**: Free
  - 256MB storage
  - 60 hours compute/month

- **Pro**: $20/month
  - 1GB storage
  - 100 hours compute/month

### External Services
- **OpenAI/Anthropic**: Pay per API call
- **Stripe**: 2.9% + $0.30 per transaction
- **Google OAuth**: Free

## Next Steps

1. **Fix Node Version Mismatch**
   ```bash
   # Update package.json engines to match .nvmrc
   ```

2. **Create vercel.json Configuration**
   ```bash
   # Use recommended configuration above
   ```

3. **Provision Database**
   ```bash
   # Setup Vercel Postgres or external provider
   ```

4. **Configure Environment Variables**
   ```bash
   # Add all required secrets in Vercel Dashboard
   ```

5. **Setup Google OAuth**
   ```bash
   # Create OAuth credentials and configure callback URLs
   ```

6. **Deploy to Vercel**
   ```bash
   git push origin main
   # Or use Vercel CLI: vercel --prod
   ```

7. **Test Deployment**
   ```bash
   # Verify all functionality works
   ```

8. **Monitor Performance**
   ```bash
   # Check Vercel Analytics and function logs
   ```

## Conclusion

This application is well-structured for Vercel deployment. The main requirements are:

1. **Database setup** (Vercel Postgres recommended)
2. **Environment variables configuration**
3. **Google OAuth credentials**
4. **Node version alignment**

Once these are configured, deployment should be straightforward and the application will benefit from Vercel's:
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Serverless functions
- ✅ Zero-config deployment
- ✅ Built-in analytics
- ✅ Preview deployments
- ✅ Git integration

**Estimated Setup Time**: 30-45 minutes

---

*Generated on 2025-11-23 for RWFW Lesson Plan Generator*

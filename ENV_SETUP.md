# Environment Variables Setup Guide

This guide explains how to properly set up environment variables for the Root Work Framework Lesson Plan Generator.

## 🔒 Security First

**CRITICAL:** Never commit files containing real secrets to git!

- ✅ `.env.example` - Template file (safe to commit)
- ❌ `.env` - Contains real secrets (DO NOT COMMIT)
- ❌ `.env.local` - Local development secrets (DO NOT COMMIT)
- ❌ `.env.production` - Production secrets (DO NOT COMMIT)

These files are already in `.gitignore` to protect you.

---

## 🚀 Quick Start

### For Local Development

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` and fill in your real values:**
   ```bash
   # Use your favorite editor
   nano .env.local
   # or
   code .env.local
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

---

## 📋 Required Environment Variables

### 1. Database (PostgreSQL)

```bash
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
```

**Where to get it:**
- **Vercel Postgres:** [vercel.com/storage](https://vercel.com/storage) → Create Database → Copy connection string
- **Supabase:** [supabase.com](https://supabase.com) → Project Settings → Database → Connection string
- **Local:** Install PostgreSQL locally and use `postgresql://localhost:5432/rwfw_lesson_plan_generator`

**Setup database:**
```bash
# After setting DATABASE_URL, run:
npx prisma migrate deploy
npx prisma generate
```

### 2. Authentication (NextAuth.js)

```bash
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**NEXTAUTH_URL values:**
- Local development: `http://localhost:3000`
- Production: `https://rwfw-lessonplan-generator.app` (your actual domain)

### 3. Google OAuth

```bash
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

**How to get Google OAuth credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (if not done already)
6. Set Application type: **Web application**
7. Add Authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://rwfw-lessonplan-generator.app/api/auth/callback/google`
8. Copy the Client ID and Client Secret

### 4. Anthropic Claude API

```bash
ANTHROPIC_API_KEY="sk-ant-xxxxx"
```

**How to get it:**
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-`)

### 5. Stripe (Optional - for payments)

```bash
STRIPE_SECRET_KEY="sk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

**How to get it:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from **Developers** → **API keys**
3. Use **test keys** (`sk_test_...`) for development
4. Use **live keys** (`sk_live_...`) for production
5. For webhooks: **Developers** → **Webhooks** → **Add endpoint**

---

## 🌍 Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub (without `.env` files!)
2. Import project in Vercel
3. Add environment variables in **Project Settings** → **Environment Variables**
4. Set production values:
   ```
   DATABASE_URL=<your-production-database>
   NEXTAUTH_SECRET=<generate-new-secret-for-production>
   NEXTAUTH_URL=https://rwfw-lessonplan-generator.app
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   ANTHROPIC_API_KEY=<your-anthropic-key>
   ```
5. Deploy!

### Other Platforms

Add environment variables through your platform's dashboard or CLI:
- **Netlify:** Site Settings → Environment Variables
- **Railway:** Project → Variables
- **Render:** Environment → Environment Variables
- **DigitalOcean App Platform:** Settings → App-Level Environment Variables

---

## 🧪 Testing Your Setup

After setting up environment variables:

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npx prisma migrate deploy
npx prisma generate

# 3. Start dev server
npm run dev

# 4. Test these features:
# - Navigate to http://localhost:3000
# - Click "Sign in" button
# - Try signing in with Google
# - Create a lesson plan (requires Anthropic API key)
```

---

## ❓ Troubleshooting

### "Invalid database URL"
- Check your `DATABASE_URL` is correctly formatted
- Make sure database server is running
- Run `npx prisma migrate deploy`

### "NextAuth configuration error"
- Verify `NEXTAUTH_SECRET` is set (generate with `openssl rand -base64 32`)
- Check `NEXTAUTH_URL` matches your current environment

### "Google OAuth 404 error"
- Ensure `NEXTAUTH_URL` matches your current domain (localhost:3000 for local)
- Verify Google redirect URI includes `/api/auth/callback/google`
- Check Google Client ID and Secret are correct

### "Anthropic API error"
- Verify your API key starts with `sk-ant-`
- Check you have credits in your Anthropic account
- Make sure the key has the correct permissions

---

## 🔐 Security Best Practices

1. ✅ **Never commit secrets** to git
2. ✅ **Use different secrets** for development and production
3. ✅ **Rotate secrets regularly** (especially after team member changes)
4. ✅ **Use environment-specific files**:
   - `.env.local` for local development
   - Platform environment variables for production
5. ✅ **Keep `.env.example` updated** when adding new variables
6. ✅ **Audit git history** if secrets were accidentally committed

---

## 📝 Adding New Environment Variables

When you add a new environment variable:

1. Add it to `.env.example` with documentation
2. Add it to this README under the appropriate section
3. Update your local `.env.local` file
4. Update production environment variables on your deployment platform
5. Notify team members to update their local environment

---

## 🆘 Need Help?

- Check the [Next.js Environment Variables docs](https://nextjs.org/docs/basic-features/environment-variables)
- Review [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- See [Prisma Connection Management](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

For project-specific questions, contact the development team.

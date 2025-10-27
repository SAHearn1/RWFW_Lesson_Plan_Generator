# Next.js + Tailwind CSS + TypeScript Starter and Boilerplat

<div align="center">
  <h2>🔋 ts-nextjs-tailwind-starter</h2>
  <p>Next.js + Tailwind CSS + TypeScript starter packed with useful development features.</p>
  <p>Made by <a href="https://theodorusclarence.com">Theodorus Clarence</a></p>

[![GitHub Repo stars](https://img.shields.io/github/stars/theodorusclarence/ts-nextjs-tailwind-starter)](https://github.com/theodorusclarence/ts-nextjs-tailwind-starter/stargazers)
[![Depfu](https://badges.depfu.com/badges/fc6e730632ab9dacaf7df478a08684a7/overview.svg)](https://depfu.com/github/theodorusclarence/ts-nextjs-tailwind-starter?project_id=30160)
[![Last Update](https://img.shields.io/badge/deps%20update-every%20sunday-blue.svg)](https://shields.io/)

</div>

## Features

This repository is 🔋 battery packed with:

- ⚡️ Next.js 14 with App Router
- ⚛️ React 18
- ✨ TypeScript
- 💨 Tailwind CSS 3 — Configured with CSS Variables to extend the **primary** color
- 💎 Pre-built Components — Components that will **automatically adapt** with your brand color, [check here for the demo](https://tsnext-tw.thcl.dev/components)
- 🃏 Jest — Configured for unit testing
- 📈 Absolute Import and Path Alias — Import components using `@/` prefix
- 📏 ESLint — Find and fix problems in your code, also will **auto sort** your imports
- 💖 Prettier — Format your code consistently
- 🐶 Husky & Lint Staged — Run scripts on your staged files before they are committed
- 🤖 Conventional Commit Lint — Make sure you & your teammates follow conventional commit
- ⏰ Release Please — Generate your changelog by activating the `release-please` workflow
- 👷 Github Actions — Lint your code on PR
- 🚘 Automatic Branch and Issue Autolink — Branch will be automatically created on issue **assign**, and auto linked on PR
- 🔥 Snippets — A collection of useful snippets
- 👀 Open Graph Helper Function — Awesome open graph generated using [og](https://github.com/theodorusclarence/og), fork it and deploy!
- 🗺 Site Map — Automatically generate sitemap.xml
- 📦 Expansion Pack — Easily install common libraries, additional components, and configs.

## Authentication & Data Collection

This application now uses [NextAuth.js](https://next-auth.js.org/) with a Prisma adapter to handle secure user sign-in and persistence. When a visitor authenticates, their profile (name, email, avatar) is stored in the connected PostgreSQL database. The generator interface and AI endpoints are protected so only signed-in educators can request new plans, allowing you to track usage per user.

### Required Environment Variables

Configure the following variables locally (`.env`) and on Vercel before deploying:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
NEXTAUTH_SECRET="generate_a_strong_secret"
NEXTAUTH_URL="https://your-vercel-domain.vercel.app" # or http://localhost:3000 for local dev
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

> ⚠️ **Do not commit your `.env` file.** Keep these secrets local by ensuring `.env` stays untracked (it is now covered in `.gitignore`) and add the same values to Vercel via **Settings → Environment Variables** for your production deployment.

Create a Google OAuth Client (Web application) and add the callback URL `https://your-domain.vercel.app/api/auth/callback/google` (or `http://localhost:3000/api/auth/callback/google` for local development).

> ✅ **Double-check your OAuth settings.** The callback URL must match the value configured in the Google Cloud console *and* the `NEXTAUTH_URL` environment variable. When using Vercel previews or a custom domain, update both places so Google redirects back to your deployment successfully.

### Troubleshooting NextAuth endpoints

If you receive `Invalid regular expression flags` in the browser console while testing `/api/auth` routes, remember that the console treats bare strings that start and end with `/` as regular expression literals. Test with the browser address bar instead (`https://<your-domain>/api/auth/session`) or call fetch directly:

```ts
fetch('/api/auth/session')
  .then((response) => response.json())
  .then(console.log);
```

Seeing 404s on `/api/auth/*` usually means the NextAuth route is not being hit. Walk through the following checks:

1. **Verify the handler file path.** It must live at `src/app/api/auth/[...nextauth]/route.ts`:

   ```ts
   import NextAuth from 'next-auth';
   import { authOptions } from '@/lib/auth';

   export const runtime = 'nodejs';
   export const dynamic = 'force-dynamic';

   const handler = NextAuth(authOptions);
   export { handler as GET, handler as POST };
   ```

   Remove any stale `pages/api/auth/[...nextauth].ts` files so only a single handler exists.
2. **Ensure API routes are enabled.** Do not set `output: 'export'` in `next.config.js`—that setting removes API routes.
3. **Bypass middleware for auth routes.** If you add `src/middleware.ts`, make sure it returns `NextResponse.next()` when `pathname.startsWith('/api/auth')`, or exclude `api` in the matcher.
4. **Avoid rewriting auth routes.** When using custom rewrites, prepend `{ source: '/api/:path*', destination: '/api/:path*' }` so `/api/auth/*` is untouched.
5. **Use default basePath and pages.** Do not override `basePath` in `authOptions`, and if you configure `pages.error`, point it to a normal page route (not an API path).
6. **Re-test in production.** Visit `https://<your-domain>/api/auth/session` for JSON and `https://<your-domain>/api/auth/signin` for the NextAuth UI.

See the 👉 [feature details and changelog](https://github.com/theodorusclarence/ts-nextjs-tailwind-starter/blob/main/CHANGELOG.md) 👈 for more.

You can also check all of the **details and demos** on my blog post:

- [One-stop Starter to Maximize Efficiency on Next.js & Tailwind CSS Projects](https://theodorusclarence.com/blog/one-stop-starter)

## Getting Started

### 1. Clone this template using one of the three ways

1. Use this repository as template

   **Disclosure:** by using this repository as a template, there will be an attribution on your repository.

   I'll appreciate if you do, so this template can be known by others too 😄

   ![Use as template](https://user-images.githubusercontent.com/55318172/129183039-1a61e68d-dd90-4548-9489-7b3ccbb35810.png)

2. Using `create-next-app`

   ```bash
   pnpm create next-app  -e https://github.com/theodorusclarence/ts-nextjs-tailwind-starter ts-pnpm
   ```

   If you still want to use **pages directory** (_is not actively maintained_) you can use this command

   ```bash
   npx create-next-app -e https://github.com/theodorusclarence/ts-nextjs-tailwind-starter/tree/pages-directory project-name
   ```

3. Using `degit`

   ```bash
   npx degit theodorusclarence/ts-nextjs-tailwind-starter YOUR_APP_NAME
   ```

4. Deploy to Vercel

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Ftheodorusclarence%2Fts-nextjs-tailwind-starter)

### 2. Install dependencies

Install dependencies with your preferred package manager. The project and CI now default to **npm**, but pnpm and yarn will also work if you already have them configured locally.

```bash
npm install
```

### 3. Install Specify CLI (Optional)

This project supports [GitHub Spec Kit](https://github.com/github/spec-kit) for spec-driven development. To use the specify CLI tool:

1. Install [uv](https://docs.astral.sh/uv/) (Python package manager):

   ```bash
   pip install uv
   ```

2. Install specify-cli:

   ```bash
   uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
   ```

3. Verify installation:

   ```bash
   specify check
   ```

The Specify CLI enables you to:
- Create specifications for features using `/speckit.specify`
- Generate technical implementation plans with `/speckit.plan`
- Break down work into actionable tasks with `/speckit.tasks`
- Execute implementations with `/speckit.implement`

For more information, visit the [Spec Kit documentation](https://github.github.io/spec-kit/).

### 4. Run the development server

You can start the server using this command:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can start editing the page by modifying `src/pages/index.tsx`.

### 5. Change defaults

There are some things you need to change including title, urls, favicons, etc.

Find all comments with !STARTERCONF, then follow the guide.

Don't forget to change the package name in package.json

### 6. Commit Message Convention

This starter is using [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/), it is mandatory to use it to commit changes.

## Projects using ts-nextjs-tailwind-starter

<!--
TEMPLATE
- [sitename](https://sitelink.com) ([Source](https://github.com/githublink))
- [sitename](https://sitelink.com)
-->

- [theodorusclarence.com](https://theodorusclarence.com) ([Source](https://github.com/theodorusclarence/theodorusclarence.com))
- [Notiolink](https://notiolink.thcl.dev/) ([Source](https://github.com/theodorusclarence/notiolink))
- [NextJs + Materia UI + Typescript](https://github.com/AlexStack/nextjs-materia-mui-typescript-hook-form-scaffold-boilerplate-starter)

Are you using this starter? Please add your page (and repo) to the end of the list via a [Pull Request](https://github.com/theodorusclarence/ts-nextjs-tailwind-starter/edit/main/README.md). 😃

## Expansion Pack 📦

This starter is now equipped with an [expansion pack](https://github.com/theodorusclarence/expansion-pack).

You can easily add expansion such as React Hook Form + Components, Storybook, and more just using a single command line.

<https://user-images.githubusercontent.com/55318172/146631994-e1cac137-1664-4cfe-950b-a96decc1eaa6.mp4>

Check out the [expansion pack repository](https://github.com/theodorusclarence/expansion-pack) for the commands

### App Router Update

Due to App Router update, the expansion pack is currently **outdated**. It will be updated in the future. You can still use them by copy and pasting the files.

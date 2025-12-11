import 'server-only';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  VERCEL_URL: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${parsedEnv.error.message}`);
}

const env = parsedEnv.data;

const requiredProdKeys: (keyof typeof env)[] = [
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

const missingProd = requiredProdKeys.filter((key) => !env[key]);

if (env.NODE_ENV === 'production' && missingProd.length > 0) {
  throw new Error(
    `Missing required environment variables for production: ${missingProd.join(', ')}`
  );
}

const recommendedKeys: (keyof typeof env)[] = [
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

const missingRecommended = recommendedKeys.filter((key) => !env[key]);

if (missingRecommended.length > 0) {
  console.warn(
    `[env] Missing recommended environment variables: ${missingRecommended.join(', ')}`
  );
}

export { env };

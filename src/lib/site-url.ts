const DEFAULT_SITE_URL = 'http://localhost:3000';

/**
 * Resolve the best available site base URL for client-side redirects.
 *
 * Preference order:
 * 1. NEXT_PUBLIC_SITE_URL (canonical deployment domain)
 * 2. NEXTAUTH_URL (server-provided fallback)
 * 3. Browser origin (keeps previews/local pointing at the active host)
 * 4. Localhost default
 */
export function getSiteBaseUrl() {
  const envBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL;

  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return DEFAULT_SITE_URL;
}

export function buildSiteUrl(path: string) {
  const base = getSiteBaseUrl().replace(/\/$/, '');
  const safePath = path.startsWith('/') ? path : `/${path}`;

  return `${base}${safePath}`;
}

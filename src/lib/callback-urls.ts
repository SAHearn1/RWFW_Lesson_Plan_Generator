import { useMemo } from 'react';

import { buildSiteUrl } from './site-url';

export function useGeneratorCallbackUrl() {
  return useMemo(() => buildSiteUrl('/generator'), []);
}

export function useHomeCallbackUrl() {
  return useMemo(() => buildSiteUrl('/'), []);
}

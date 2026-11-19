import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useApi } from './api';
import type { SiteSettings } from './types';

interface Ctx {
  settings: SiteSettings | null;
  loading: boolean;
}
const SiteContext = createContext<Ctx>({ settings: null, loading: true });

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data, loading } = useApi<{ data: SiteSettings }>('/api/settings');
  const value = useMemo(() => ({ settings: data?.data ?? null, loading }), [data, loading]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);

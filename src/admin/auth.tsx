import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import type { AdminUser } from '../lib/types';
import { PageSkeleton } from '../components/States';

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get<{ data: { user: AdminUser } }>('/api/auth/me')
      .then((r) => alive && setUser(r.data.user))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<{ data: { user: AdminUser } }>('/api/auth/login', { email, password });
    setUser(r.data.user);
  }, []);
  const logout = useCallback(async () => {
    await api.post('/api/auth/logout').catch(() => undefined);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

export function RequireRole({ role, children }: { role: 'admin'; children: ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== role) {
    return (
      <div className="state">
        <h1 style={{ fontSize: 'var(--h2)' }}>You do not have access to this page</h1>
        <p className="muted">This area is for admins. Editors can manage projects, services, articles, testimonials, team profiles and media.</p>
      </div>
    );
  }
  return <>{children}</>;
}

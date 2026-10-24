/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, normalizeApiError, setCsrfToken, type ApiError } from "../services/api";
import type { AppRole } from "../components/layout/AppShell";

export type AuthUser = { id: string; name: string; email: string; role: AppRole; avatarUrl: string; isActive: boolean; mustChangePassword: boolean; createdAt: string; updatedAt: string };
type AuthContextValue = {
  user: AuthUser | null; loading: boolean; error: ApiError | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthUser>;
  updateUser: (user: AuthUser) => void;
  clearError: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const accept = (data: { user: AuthUser; csrfToken?: string }) => { setUser(data.user); if (data.csrfToken) setCsrfToken(data.csrfToken); setError(null); return data.user; };

  useEffect(() => {
    let active = true;
    api.get("/auth/me").then(({ data }) => { if (active) accept(data.data); }).catch(() => { if (active) { setUser(null); setCsrfToken(null); } }).finally(() => { if (active) setLoading(false); });
    const unauthenticated = () => { setUser(null); setCsrfToken(null); };
    window.addEventListener("brandhub:unauthenticated", unauthenticated);
    return () => { active = false; window.removeEventListener("brandhub:unauthenticated", unauthenticated); };
  }, []);

  const run = useCallback(async (request: Promise<{ data: { data: { user: AuthUser; csrfToken?: string } } }>) => {
    try { return accept((await request).data.data); } catch (caught) { const normalized = normalizeApiError(caught); setError(normalized); throw normalized; }
  }, []);
  const login = useCallback((email: string, password: string) => run(api.post("/auth/login", { email, password })), [run]);
  const register = useCallback((name: string, email: string, password: string) => run(api.post("/auth/register", { name, email, password })), [run]);
  const changePassword = useCallback((currentPassword: string, newPassword: string) => run(api.patch("/auth/change-password", { currentPassword, newPassword })), [run]);
  const logout = useCallback(async () => { try { await api.post("/auth/logout"); } finally { setUser(null); setCsrfToken(null); } }, []);
  const value = useMemo(() => ({ user, loading, error, login, register, logout, changePassword, updateUser: setUser, clearError: () => setError(null) }), [user, loading, error, login, register, logout, changePassword]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

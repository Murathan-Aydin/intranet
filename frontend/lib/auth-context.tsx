"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, clearTokens, getAccess, login as apiLogin } from "./api";

export type Role = "student" | "instructor" | "secretary" | "admin";

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  student_profile?: {
    id: number;
    purchased_minutes: number;
    consumed_minutes: number;
    remaining_minutes: number;
    phone: string;
    address: string;
    birth_date: string | null;
    notes: string;
  } | null;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<CurrentUser>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    const access = getAccess();
    if (!access) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<CurrentUser>("/api/me/");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      await apiLogin(username, password);
      const me = await api<CurrentUser>("/api/me/");
      setUser(me);
      return me;
    },
    [],
  );

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refresh }),
    [user, loading, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type Role = 'admin' | 'member' | 'committee' | null;

interface UserProfile {
  id: string;
  email?: string;
  role: Role;
  member_id?: string;
  is_first_login?: boolean;
}

interface AuthContextType {
  // Supabase session
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: Role;
  isLoading: boolean;

  // Legacy token support (for backward compatibility during transition)
  token: string | null;

  // Auth methods
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Legacy login (kept for backward compatibility)
  login: (token: string, userDetails?: { role?: Role; sub?: string }) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  token: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUp: async () => {},
  logout: async () => {},
  login: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Legacy token state (backward compatibility)
  const [legacyToken, setLegacyToken] = useState<string | null>(null);
  const [legacyUser, setLegacyUser] = useState<{ role?: Role; sub?: string } | null>(null);

  // Fetch user profile (role, member_id, etc.)
  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, member_id, is_first_login, is_active')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Failed to fetch profile:', error);
        return null;
      }

      const userProfile: UserProfile = {
        id: data.id,
        email,
        role: data.role as Role,
        member_id: data.member_id,
        is_first_login: data.is_first_login,
      };

      setProfile(userProfile);
      return userProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    // Check for existing Supabase session
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession) {
          setSession(currentSession);
          await fetchProfile(currentSession.user.id, currentSession.user.email);
        } else {
          // Check for legacy token
          const t = localStorage.getItem('kjo_token');
          if (t) {
            const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('kjo_token='));
            if (!hasCookie) {
              localStorage.removeItem('kjo_token');
            } else {
              setLegacyToken(t);
              const decoded = parseJwt(t);
              if (decoded && (!decoded.exp || decoded.exp * 1000 > Date.now())) {
                setLegacyUser({ sub: decoded.sub, role: decoded.role || null });
              }
            }
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          // Set cookie for middleware
          document.cookie = `sb-uevmyvwbmxqreyukbvkq-auth-token=${newSession.access_token}; path=/; max-age=${newSession.expires_in || 3600}; samesite=lax`;
          await fetchProfile(newSession.user.id, newSession.user.email);
        } else {
          setProfile(null);
          // Clear cookie for middleware
          document.cookie = 'sb-uevmyvwbmxqreyukbvkq-auth-token=; path=/; max-age=0;';
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Decode JWT safely (for legacy tokens)
  const parseJwt = (t: string) => {
    try {
      const base64Url = t.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) {
        if (pad === 1) {
          throw new Error('InvalidLengthError');
        }
        base64 += new Array(5 - pad).join('=');
      }
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          // Always show account selection — prevents silent re-login after logout
          prompt: 'select_account',
          access_type: 'online',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  // Sign up with email/password
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setSession(null);
      setProfile(null);
      setLegacyToken(null);
      setLegacyUser(null);

      // Clear all Supabase localStorage keys (sb-* pattern)
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('kjo_token');

      // Clear all auth cookies
      document.cookie = 'kjo_token=; Max-Age=0; path=/;';
      document.cookie = 'sb-uevmyvwbmxqreyukbvkq-auth-token=; path=/; max-age=0;';

      window.dispatchEvent(new Event('kjo_auth_change'));
    }
  };

  // Legacy login method (backward compatibility)
  const login = (newToken: string, userDetails?: { role?: Role; sub?: string }) => {
    localStorage.setItem('kjo_token', newToken);
    document.cookie = `kjo_token=${newToken}; path=/; samesite=lax`;
    const decoded = parseJwt(newToken);
    const resolvedUser = userDetails || { sub: decoded?.sub, role: decoded?.role || null };
    setLegacyToken(newToken);
    setLegacyUser(resolvedUser);
    window.dispatchEvent(new Event('kjo_auth_change'));
  };

  // Determine the effective role and token
  const effectiveRole: Role = profile?.role || legacyUser?.role || null;
  const effectiveToken = session?.access_token || legacyToken;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        role: effectiveRole,
        isLoading,
        token: effectiveToken,
        signInWithGoogle,
        signInWithEmail,
        signUp,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

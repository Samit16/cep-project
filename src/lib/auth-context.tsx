'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, SUPABASE_STORAGE_KEY } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type Role = 'admin' | 'member' | 'committee' | null;

interface UserProfile {
  id: string;
  email?: string;
  role: Role;
  member_id?: string;
  family_id?: string;
  is_first_login?: boolean;
}

interface AuthContextType {
  // Supabase session
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: Role;
  isLoading: boolean;
  token: string | null;

  // Auth methods
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string, expectedTab?: 'member' | 'committee') => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
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
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile (role, member_id, etc.)
  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, member_id, is_first_login, is_active')
        .eq('id', userId)
        .single();

      // Fetch family_id from the linked member record
      let familyId: string | undefined;
      if (data?.member_id) {
        const { data: memberData } = await supabase
          .from('members')
          .select('family_id')
          .eq('id', data.member_id)
          .single();
        familyId = memberData?.family_id ?? undefined;
      }

      if (error || !data) {
        console.error('Failed to fetch profile:', error);
        return null;
      }

      const userProfile: UserProfile = {
        id: data.id,
        email,
        role: data.role as Role,
        member_id: data.member_id,
        family_id: familyId,
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
          // Set session cookie for middleware (no max-age = deleted on browser close)
          document.cookie = `${SUPABASE_STORAGE_KEY}=${currentSession.access_token}; path=/; samesite=lax`;
          await fetchProfile(currentSession.user.id, currentSession.user.email);
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
      (event, newSession) => {
        setSession(newSession);

        if (newSession?.user) {
          // Set session cookie for middleware (no max-age = deleted on browser close)
          document.cookie = `${SUPABASE_STORAGE_KEY}=${newSession.access_token}; path=/; samesite=lax`;
          
          fetchProfile(newSession.user.id, newSession.user.email).then(fetchedProfile => {
            if (fetchedProfile) {
              const provider = newSession.user.app_metadata?.provider || 'email';
              if (provider === 'google' && fetchedProfile.is_first_login) {
                // Reject direct OAuth login if it is their first login
                alert('Please login with your Member Username and Password first to verify your account. You can link Google afterwards.');
                supabase.auth.signOut().then(() => {
                  setSession(null);
                  setProfile(null);
                  setIsLoading(false);
                });
                return;
              }
            }
            setIsLoading(false);
          });
        } else {
          setProfile(null);
          if (event === 'SIGNED_OUT') {
            // Clear cookie for middleware only on explicit sign out
            document.cookie = `${SUPABASE_STORAGE_KEY}=; path=/; max-age=0;`;
          }
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
  const signInWithEmail = async (emailOrUsername: string, password: string, expectedTab?: 'member' | 'committee') => {
    setIsLoading(true);
    try {
      // 1. Call our secure backend resolver which handles the dummy email logic
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: emailOrUsername, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // 2. Hydrate the client-side session using the session returned by the server
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      if (sessionError) throw sessionError;

      // 3. The onAuthStateChange listener will now trigger and fetch the profile.
      // We manually fetch the profile here to ensure we have it immediately for role checking.
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();
        
        if (profile) {
          const userRole = profile.role;
          if (expectedTab === 'committee' && userRole !== 'admin' && userRole !== 'committee') {
            await supabase.auth.signOut();
            throw new Error("You are a member. Please log in via Member Login.");
          }
          if (expectedTab === 'member' && (userRole === 'admin' || userRole === 'committee')) {
            await supabase.auth.signOut();
            throw new Error("You are a committee member. Please log in via Committee Login.");
        }
      }
    } catch (err: unknown) {
      setIsLoading(false);
      throw new Error((err as Error).message || 'Login failed');
    } finally {
      setIsLoading(false);
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
    // Clear React state first so UI updates immediately
    setSession(null);
    setProfile(null);

    // Clear all Supabase keys from both localStorage and sessionStorage synchronously
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('kjo_token');
      localStorage.removeItem('kjo_auth_method');
      localStorage.removeItem('kjo_login_intent');

      Object.keys(sessionStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => sessionStorage.removeItem(k));
      sessionStorage.removeItem('kjo_token');
      sessionStorage.removeItem('kjo_prompt_dismissed');
    }

    // Clear all auth cookies explicitly
    const pastDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = `kjo_token=; expires=${pastDate}; path=/; samesite=lax`;
    document.cookie = `${SUPABASE_STORAGE_KEY}=; expires=${pastDate}; path=/; samesite=lax`;
    document.cookie = `${SUPABASE_STORAGE_KEY}=; expires=${pastDate}; path=/`;

    // Dispatch event immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kjo_auth_change'));
    }

    // Call Supabase signOut with a timeout so it doesn't hang the UI
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 2000)
      );
      await Promise.race([supabase.auth.signOut(), timeoutPromise]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Determine the effective role and token
  const effectiveRole: Role = profile?.role || null;
  const effectiveToken = session?.access_token || null;

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


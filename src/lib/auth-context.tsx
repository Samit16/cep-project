'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Role = 'admin' | 'member' | null;

interface UserDetails {
  id?: string;
  sub?: string;
  role: Role;
}

interface AuthContextType {
  token: string | null;
  user: UserDetails | null;
  role: Role;
  login: (token: string, userDetails: UserDetails) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  role: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decode JWT safely
  const parseJwt = (t: string) => {
    try {
      return JSON.parse(atob(t.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('kjo_token');
    document.cookie = 'kjo_token=; Max-Age=0; path=/;'; // clear cookie for middleware
    window.dispatchEvent(new Event('kjo_auth_change'));
  };

  const syncAuth = () => {
    const t = localStorage.getItem('kjo_token');
    if (t) {
      const decoded = parseJwt(t);
      if (decoded && decoded.exp && decoded.exp * 1000 < Date.now()) {
        // Expired
        handleLogout();
      } else if (decoded) {
        setToken(t);
        setUser({ sub: decoded.sub, role: decoded.role || 'member' });
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    syncAuth();

    // Listen for cross-tab or interceptor events
    const listener = () => syncAuth();
    window.addEventListener('kjo_auth_change', listener);
    return () => window.removeEventListener('kjo_auth_change', listener);
  }, []);

  const login = (newToken: string, userDetails?: UserDetails) => {
    localStorage.setItem('kjo_token', newToken);
    // Secure enough for routing. Expiration handled natively if we have explicit timing, but simply dropping session is ok
    document.cookie = `kjo_token=${newToken}; path=/; max-age=604800; samesite=lax`; 
    
    // Fallback if userDetails not provided directly: decode token
    const decoded = parseJwt(newToken);
    const resolvedUser = userDetails || { sub: decoded?.sub, role: decoded?.role || 'member' };

    setToken(newToken);
    setUser(resolvedUser);
    window.dispatchEvent(new Event('kjo_auth_change'));
  };

  return (
    <AuthContext.Provider value={{ token, user, role: user?.role || null, login, logout: handleLogout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

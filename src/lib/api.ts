import { SUPABASE_STORAGE_KEY, supabase } from './supabase';

export class ApiClient {
  private static get baseUrl() {
    return '/api';
  }

  // Cache token to avoid repeated async calls within the same tick
  private static _cachedToken: string | null = null;
  private static _cacheExpiry = 0;

  private static getTokenSync(): string | null {
    // Return cached token if still valid (cache for 30s)
    if (this._cachedToken && Date.now() < this._cacheExpiry) {
      return this._cachedToken;
    }

    if (typeof window === 'undefined') return null;

    let token: string | null = null;

    // 1. Check Supabase sessionStorage (where the client stores sessions)
    try {
      const sessionData = sessionStorage.getItem(SUPABASE_STORAGE_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // Handle both v2 flat format and legacy nested format
        token = parsed?.access_token
          || parsed?.currentSession?.access_token
          || parsed?.session?.access_token
          || null;
      }
    } catch { /* ignore parse errors */ }

    // 2. Fallback: scan all sessionStorage keys for any Supabase session
    if (!token) {
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            const raw = sessionStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              token = parsed?.access_token || parsed?.session?.access_token || null;
              if (token) break;
            }
          }
        }
      } catch { /* ignore */ }
    }

    // 3. Fallback: check cookie
    if (!token) {
      try {
        const match = document.cookie.match(new RegExp(`(^| )${SUPABASE_STORAGE_KEY}=([^;]+)`));
        if (match) token = match[2];
      } catch { /* ignore */ }
    }

    if (token) {
      this._cachedToken = token;
      this._cacheExpiry = Date.now() + 30_000;
    }

    return token;
  }

  // Async token getter - tries sync first, then falls back to supabase.auth.getSession()
  private static async getTokenAsync(): Promise<string | null> {
    const syncToken = this.getTokenSync();
    if (syncToken) return syncToken;

    // Last resort: ask Supabase client directly
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        this._cachedToken = session.access_token;
        this._cacheExpiry = Date.now() + 30_000;
        return session.access_token;
      }
    } catch { /* ignore */ }

    return null;
  }

  private static getHeaders(customHeaders: Record<string, string> = {}, token?: string | null) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...customHeaders,
    };

    const effectiveToken = token ?? this.getTokenSync();
    if (effectiveToken) {
      headers['Authorization'] = `Bearer ${effectiveToken}`;
    }
    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('kjo_auth_change'));
        // Optional: window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.detail || data?.error || response.statusText || 'API Request failed';
      throw new Error(errorMsg);
    }

    return data as T;
  }

  static async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const query = new URLSearchParams(
        Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null && v !== '') acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      ).toString();
      if (query) url += `?${query}`;
    }

    const token = await this.getTokenAsync();
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders({}, token),
    });
    return this.handleResponse<T>(response);
  }

  static async post<T>(endpoint: string, body: unknown): Promise<T> {
    const isFormData = body instanceof FormData;
    const token = await this.getTokenAsync();
    const headers = this.getHeaders({}, token);
    if (isFormData) {
      delete headers['Content-Type']; // Let browser set boundary
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: isFormData ? body : JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return await this.handleResponse<T>(response);
    } catch (err: unknown) {
      throw new Error((err as Error).message || 'Network error or backend unreachable.');
    }
  }

  static async put<T>(endpoint: string, body: unknown): Promise<T> {
    const token = await this.getTokenAsync();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders({}, token),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const token = await this.getTokenAsync();
    const headers = this.getHeaders({}, token);
    delete headers['Content-Type']; // Fix Fastify 400 Bad Request on empty body
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse<T>(response);
  }
}

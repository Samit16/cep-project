export class ApiClient {
  private static get baseUrl() {
    return '/api';
  }

  private static getHeaders(customHeaders: Record<string, string> = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...customHeaders,
    };

    if (typeof window !== 'undefined') {
      let token: string | null = null;

      // 1. Check Supabase sessionStorage (where the client actually stores sessions)
      try {
        const sessionData = sessionStorage.getItem('sb-uevmyvwbmxqreyukbvkq-auth-token');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          token = parsed?.access_token || parsed?.currentSession?.access_token || null;
        }
      } catch { /* ignore parse errors */ }

      // 2. Fallback: check cookie
      if (!token) {
        const match = document.cookie.match(new RegExp('(^| )sb-uevmyvwbmxqreyukbvkq-auth-token=([^;]+)'));
        if (match) token = match[2];
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
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
      throw new Error(data?.error || response.statusText || 'API Request failed');
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

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  static async post<T>(endpoint: string, body: unknown): Promise<T> {
    const isFormData = body instanceof FormData;
    const headers = this.getHeaders();
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
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const headers = this.getHeaders();
    delete headers['Content-Type']; // Fix Fastify 400 Bad Request on empty body
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    return this.handleResponse<T>(response);
  }
}

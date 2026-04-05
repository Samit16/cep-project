export class ApiClient {
  private static get baseUrl() {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  }

  private static getHeaders(customHeaders: Record<string, string> = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...customHeaders,
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('kjo_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kjo_token');
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

  static async post<T>(endpoint: string, body: any): Promise<T> {
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
    } catch (err: any) {
      throw new Error(err.message || 'Network error or backend unreachable.');
    }
  }

  static async put<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

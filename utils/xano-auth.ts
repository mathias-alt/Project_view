// Xano Authentication Utility
// This file provides a clean interface for Xano authentication

export interface XanoAuthConfig {
  baseUrl: string;
  loginEndpoint?: string;
  signupEndpoint?: string;
}

export interface XanoUser {
  id: number;
  email: string;
  name?: string;
  [key: string]: any;
}

export interface XanoAuthResponse {
  authToken: string;
  user: XanoUser;
  [key: string]: any;
}

export class XanoAuthService {
  private config: XanoAuthConfig;

  constructor(config: XanoAuthConfig) {
    this.config = {
      loginEndpoint: '/auth/login',
      signupEndpoint: '/auth/signup',
      ...config,
    };
  }

  async login(email: string, password: string): Promise<XanoAuthResponse> {
    const response = await fetch(`${this.config.baseUrl}${this.config.loginEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store auth data
    this.storeAuthData(data);
    
    return data;
  }

  async register(email: string, password: string, additionalData: Record<string, any> = {}): Promise<XanoAuthResponse> {
    const response = await fetch(`${this.config.baseUrl}${this.config.signupEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        ...additionalData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Registration failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store auth data
    this.storeAuthData(data);
    
    return data;
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('xano_auth_token');
      localStorage.removeItem('xano_user_data');
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('xano_auth_token');
    }
    return null;
  }

  getUser(): XanoUser | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('xano_user_data');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private storeAuthData(data: XanoAuthResponse): void {
    if (typeof window !== 'undefined') {
      if (data.authToken) {
        localStorage.setItem('xano_auth_token', data.authToken);
      }
      if (data.user) {
        localStorage.setItem('xano_user_data', JSON.stringify(data.user));
      }
    }
  }

  // Helper method to get authorization header for API calls
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Helper method to make authenticated API calls
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const authHeaders = this.getAuthHeader();
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });
  }
}

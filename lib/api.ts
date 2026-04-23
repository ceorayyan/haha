// API Configuration and Helper Functions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// API Client with authentication
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(includeAuth);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }

        const error = await response.json().catch(() => ({
          message: 'An error occurred',
        }));
        throw new Error(error.message || error.errors?.[Object.keys(error.errors)[0]]?.[0] || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth Methods
  async register(data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    const response = await this.request<{
      user: any;
      token: string;
      token_type: string;
    }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);

    this.setToken(response.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{
      user: any;
      token: string;
      token_type: string;
    }>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);

    this.setToken(response.token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  }

  async logout() {
    try {
      await this.request('/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser() {
    return this.request<any>('/user');
  }

  // Review Methods
  async getReviews() {
    const response = await this.request<any>('/reviews');
    // Handle paginated response
    return response.data || response;
  }

  async getReview(id: number) {
    return this.request<any>(`/reviews/${id}`);
  }

  async createReview(data: {
    title: string;
    type: string;
    domain: string;
    description?: string;
  }) {
    const response = await this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Return the data property if it exists, otherwise return the whole response
    return response.data || response;
  }

  async updateReview(id: number, data: Partial<any>) {
    return this.request<any>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(id: number) {
    return this.request<{ message: string }>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  async getReviewSummary(id: number) {
    return this.request<any>(`/reviews/${id}/summary`);
  }

  // Article Methods
  async getArticles(reviewId: number, page: number = 1, perPage: number = 100) {
    return this.request<any>(`/reviews/${reviewId}/articles?page=${page}&per_page=${perPage}`);
  }

  async getArticle(id: number) {
    return this.request<any>(`/articles/${id}`);
  }

  async createArticle(reviewId: number, data: FormData) {
    const url = `${this.baseUrl}/reviews/${reviewId}/articles`;
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  async updateArticle(id: number, data: Partial<any>) {
    return this.request<any>(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateArticleScreening(
    id: number,
    data: {
      screening_decision: 'include' | 'exclude' | 'maybe';
      screening_notes?: string;
      exclusion_reasons?: string[];
    }
  ) {
    return this.request<any>(`/articles/${id}/screening`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async detectDuplicates(reviewId: number) {
    return this.request<any>(`/reviews/${reviewId}/articles/detect-duplicates`, {
      method: 'POST',
    });
  }

  async bulkUpdateArticles(
    reviewId: number,
    data: {
      article_ids: number[];
      screening_decision?: 'include' | 'exclude' | 'maybe';
      screening_notes?: string;
    }
  ) {
    return this.request<any>(`/reviews/${reviewId}/articles/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteArticle(id: number) {
    return this.request<{ message: string }>(`/articles/${id}`, {
      method: 'DELETE',
    });
  }

  // Screening Criteria Methods
  async getScreeningCriteria(reviewId: number) {
    return this.request<any[]>(`/reviews/${reviewId}/criteria`);
  }

  async createScreeningCriteria(
    reviewId: number,
    data: {
      type: 'inclusion' | 'exclusion';
      criteria: string;
      description?: string;
    }
  ) {
    return this.request<any>(`/reviews/${reviewId}/criteria`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScreeningCriteria(id: number, data: Partial<any>) {
    return this.request<any>(`/criteria/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScreeningCriteria(id: number) {
    return this.request<{ message: string }>(`/criteria/${id}`, {
      method: 'DELETE',
    });
  }

  // Team Member Methods
  async getTeamMembers(reviewId: number) {
    const response = await this.request<any>(`/reviews/${reviewId}/members`);
    // Handle both paginated and non-paginated responses
    return Array.isArray(response) ? response : response.data || [];
  }

  async addTeamMember(
    reviewId: number,
    data: { email: string; role: string; message?: string }
  ) {
    return this.request<any>(`/reviews/${reviewId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(reviewId: number, memberId: number) {
    return this.request<{ message: string }>(
      `/reviews/${reviewId}/members/${memberId}`,
      { method: 'DELETE' }
    );
  }

  // Helper Methods
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getStoredUser(): any | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;

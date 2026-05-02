// API Configuration and Helper Functions
import type {
  DetectionResponse,
  PaginatedDuplicates,
  StatusCounts,
  Duplicate,
} from '../types/duplicate';

const API_BASE_URL = 'http://localhost:8000';

// API Client with authentication
class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
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
    const headers = this.getHeaders(includeAuth);
    const url = `${this.baseUrl}${endpoint}`;
    
    const token = this.getToken();
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    console.log(`Token: ${token ? token.substring(0, 20) + '...' : 'NO TOKEN'}`);
    console.log(`Headers:`, headers);
    
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        // Parse error response
        const error = await response.json().catch(() => ({
          message: 'An error occurred',
        }));

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          const errorMessage = error.message || 'Unauthorized';
          throw new Error(errorMessage);
        }

        // Handle 404 Not Found (user doesn't exist)
        if (response.status === 404) {
          const errorMessage = error.message || 
                             error.errors?.email?.[0] || 
                             'No account found with this email address.';
          throw new Error(errorMessage);
        }

        // Handle 403 Forbidden
        if (response.status === 403) {
          const errorMessage = error.message || 'You do not have permission to access this resource.';
          throw new Error(errorMessage);
        }

        // Handle 422 Validation Error
        if (response.status === 422) {
          const errorMessage = error.message || 
                             error.errors?.[Object.keys(error.errors)[0]]?.[0] || 
                             'Validation failed. Please check your input.';
          throw new Error(errorMessage);
        }
        
        // Generic error message
        const errorMessage = error.message || 
                           error.errors?.[Object.keys(error.errors)[0]]?.[0] || 
                           `Request failed with status ${response.status}`;
        
        throw new Error(errorMessage);
      }

      // Request successful, return response
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
    }>('/api/register', {
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
    }>('/api/login', {
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
      await this.request('/api/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  }

  async getCurrentUser() {
    return this.request<any>('/api/user');
  }

  // Review Methods
  async getReviews() {
    const response = await this.request<any>('/api/reviews');
    // Handle paginated response
    return response.data || response;
  }

  async getReview(id: number) {
    return this.request<any>(`/api/reviews/${id}`);
  }

  async createReview(data: {
    title: string;
    type: string;
    domain: string;
    description?: string;
  }) {
    const response = await this.request<any>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    // Return the data property if it exists, otherwise return the whole response
    return response.data || response;
  }

  async updateReview(id: number, data: Partial<any>) {
    return this.request<any>(`/api/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(id: number) {
    return this.request<{ message: string }>(`/api/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleBlindMode(reviewId: number) {
    return this.request<any>(`/api/reviews/${reviewId}/blind-mode`, {
      method: 'PATCH',
    });
  }

  async getReviewSummary(id: number) {
    return this.request<any>(`/api/reviews/${id}/summary`);
  }

  // Article Methods
  async getArticles(reviewId: number, page: number = 1, perPage: number = 100) {
    return this.request<any>(`/api/reviews/${reviewId}/articles?page=${page}&per_page=${perPage}`);
  }

  async getArticle(id: number) {
    return this.request<any>(`/api/articles/${id}`);
  }

  async createArticle(reviewId: number, data: FormData) {
    const url = `${this.baseUrl}/api/reviews/${reviewId}/articles`;
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
    return this.request<any>(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateArticleScreening(
    id: number,
    data: {
      screening_decision: 'included' | 'excluded' | 'undecided';
      screening_decision_by?: string;
      screening_notes?: string;
      labels?: string[];
      exclusion_reasons?: string[];
    }
  ) {
    return this.request<any>(`/api/articles/${id}/screening`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getScreeningStats(reviewId: number) {
    return this.request<{
      total: number;
      undecided: number;
      included: number;
      excluded: number;
    }>(`/api/reviews/${reviewId}/articles/screening-stats`);
  }

  async detectDuplicates(reviewId: number) {
    return this.request<any>(`/api/reviews/${reviewId}/articles/detect-duplicates`, {
      method: 'POST',
    });
  }

  // Enhanced Duplicate Detection Methods
  async detectDuplicatesEnhanced(
    reviewId: number,
    options?: {
      clearExisting?: boolean;
      incrementalOnly?: boolean;
    }
  ): Promise<DetectionResponse> {
    return this.request<DetectionResponse>(`/api/reviews/${reviewId}/duplicates/detect`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async getDuplicates(
    reviewId: number,
    page: number = 1,
    perPage: number = 20,
    status?: string
  ): Promise<PaginatedDuplicates> {
    let url = `/api/reviews/${reviewId}/duplicates?page=${page}&per_page=${perPage}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.request<PaginatedDuplicates>(url);
  }

  async getDuplicateCounts(reviewId: number): Promise<StatusCounts> {
    return this.request<StatusCounts>(`/api/reviews/${reviewId}/duplicates/counts`);
  }

  async updateDuplicateStatus(duplicateId: number, status: string): Promise<Duplicate> {
    return this.request<Duplicate>(`/api/duplicates/${duplicateId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async resolveDuplicate(duplicateId: number, keep: 'left' | 'right' | 'both'): Promise<Duplicate> {
    return this.request<Duplicate>(`/api/duplicates/${duplicateId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ keep }),
    });
  }

  async markNotDuplicate(duplicateId: number): Promise<void> {
    await this.request<any>(`/api/duplicates/${duplicateId}/not-duplicate`, {
      method: 'POST',
    });
  }

  async deleteDuplicate(duplicateId: number): Promise<void> {
    await this.request<{ message: string }>(`/api/duplicates/${duplicateId}`, {
      method: 'DELETE',
    });
  }

  async bulkResolveDuplicates(duplicateIds: number[]): Promise<void> {
    await this.request<{ message: string }>('/api/duplicates/bulk-resolve', {
      method: 'POST',
      body: JSON.stringify({ duplicate_ids: duplicateIds }),
    });
  }

  async bulkLabelDuplicates(duplicateIds: number[], label: string): Promise<void> {
    await this.request<{ message: string }>('/api/duplicates/bulk-label', {
      method: 'POST',
      body: JSON.stringify({ duplicate_ids: duplicateIds, label }),
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
    return this.request<any>(`/api/reviews/${reviewId}/articles/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteArticle(id: number) {
    return this.request<{ message: string }>(`/api/articles/${id}`, {
      method: 'DELETE',
    });
  }

  // Screening Criteria Methods
  async getScreeningCriteria(reviewId: number) {
    return this.request<any[]>(`/api/reviews/${reviewId}/criteria`);
  }

  async createScreeningCriteria(
    reviewId: number,
    data: {
      type: 'inclusion' | 'exclusion';
      criteria: string;
      description?: string;
    }
  ) {
    return this.request<any>(`/api/reviews/${reviewId}/criteria`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScreeningCriteria(id: number, data: Partial<any>) {
    return this.request<any>(`/api/criteria/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScreeningCriteria(id: number) {
    return this.request<{ message: string }>(`/api/criteria/${id}`, {
      method: 'DELETE',
    });
  }

  // Team Member Methods
  async getTeamMembers(reviewId: number) {
    try {
      const response = await this.request<any>(`/api/reviews/${reviewId}/members`);
      // Handle both paginated and non-paginated responses
      return Array.isArray(response) ? response : response.data || [];
    } catch (error: any) {
      // Return empty array if user doesn't have access
      // This prevents console spam when checking for pending invitations
      if (error.message?.includes('Unauthorized') || 
          error.message?.includes('permission') ||
          error.message?.includes('Session expired')) {
        return [];
      }
      throw error;
    }
  }

  async addTeamMember(
    reviewId: number,
    data: { email: string; role: string; message?: string }
  ) {
    return this.request<any>(`/api/reviews/${reviewId}/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(reviewId: number, memberId: number) {
    return this.request<{ message: string }>(
      `/api/reviews/${reviewId}/members/${memberId}`,
      { method: 'DELETE' }
    );
  }

  // Settings Methods
  async getSettings() {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch settings from API:', error);
    }

    // Fallback to defaults
    return {
      website_name: 'StataNex.Ai',
      logo_url: null,
    };
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

  getCurrentBaseUrl(): string {
    return this.baseUrl;
  }
}

export const api = new ApiClient();
export default api;

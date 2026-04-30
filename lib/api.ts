// API Configuration and Helper Functions
// Multiple backend URLs with fallback support
import type {
  DetectionResponse,
  PaginatedDuplicates,
  StatusCounts,
  Duplicate,
} from '../types/duplicate';

const API_URLS = [
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  // 'https://backend-of-research-nexus-ai.free.laravel.cloud/api',
  // 'https://api.statanex.com/api',
];

// API Client with authentication
class ApiClient {
  private baseUrl: string;
  private availableUrls: string[];
  private currentUrlIndex: number = 0;

  constructor(baseUrls: string[]) {
    this.availableUrls = baseUrls;
    // FORCE localhost only - ignore any stored URL
    this.baseUrl = baseUrls[0]; // Always use first URL (localhost)
    this.currentUrlIndex = 0;
    // Clear any stored remote URL
    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_base_url');
    }
  }

  private getStoredBaseUrl(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('api_base_url');
    }
    return null;
  }

  private setStoredBaseUrl(url: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_base_url', url);
    }
  }

  private async tryNextUrl(): Promise<void> {
    // DISABLED: Don't try other URLs, stay on localhost
    console.warn('API request failed, but fallback URLs are disabled. Staying on localhost.');
    return;
  }

  public getCurrentBaseUrl(): string {
    return this.baseUrl;
  }

  public getAvailableUrls(): string[] {
    return this.availableUrls;
  }

  public setBaseUrl(url: string): void {
    if (this.availableUrls.includes(url)) {
      this.baseUrl = url;
      this.currentUrlIndex = this.availableUrls.indexOf(url);
      this.setStoredBaseUrl(url);
    }
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

    // FORCE localhost only - no retries with other URLs
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
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
        // If this is a login request, show specific error
        if (endpoint === '/login') {
          const errorMessage = error.message || 
                             error.errors?.password?.[0] || 
                             'The password you entered is incorrect.';
          throw new Error(errorMessage);
        }
        
        // For review member checks, don't redirect - just throw error
        if (endpoint.includes('/members') || endpoint.includes('/accept')) {
          throw new Error('Unauthorized');
        }
        
        // For other requests, token is invalid - clear and redirect to login
        this.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please login again.');
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
      screening_decision: 'included' | 'excluded' | 'undecided';
      screening_decision_by?: string;
      screening_notes?: string;
      labels?: string[];
      exclusion_reasons?: string[];
    }
  ) {
    return this.request<any>(`/articles/${id}/screening`, {
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
    }>(`/reviews/${reviewId}/articles/screening-stats`);
  }

  async detectDuplicates(reviewId: number) {
    return this.request<any>(`/reviews/${reviewId}/articles/detect-duplicates`, {
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
    return this.request<DetectionResponse>(`/reviews/${reviewId}/duplicates/detect`, {
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
    let url = `/reviews/${reviewId}/duplicates?page=${page}&per_page=${perPage}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.request<PaginatedDuplicates>(url);
  }

  async getDuplicateCounts(reviewId: number): Promise<StatusCounts> {
    return this.request<StatusCounts>(`/reviews/${reviewId}/duplicates/counts`);
  }

  async updateDuplicateStatus(duplicateId: number, status: string): Promise<Duplicate> {
    return this.request<Duplicate>(`/duplicates/${duplicateId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async resolveDuplicate(duplicateId: number, keep: 'left' | 'right' | 'both'): Promise<Duplicate> {
    return this.request<Duplicate>(`/duplicates/${duplicateId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ keep }),
    });
  }

  async markNotDuplicate(duplicateId: number): Promise<void> {
    await this.request<any>(`/duplicates/${duplicateId}/not-duplicate`, {
      method: 'POST',
    });
  }

  async deleteDuplicate(duplicateId: number): Promise<void> {
    await this.request<{ message: string }>(`/duplicates/${duplicateId}`, {
      method: 'DELETE',
    });
  }

  async bulkResolveDuplicates(duplicateIds: number[]): Promise<void> {
    await this.request<{ message: string }>('/duplicates/bulk-resolve', {
      method: 'POST',
      body: JSON.stringify({ duplicate_ids: duplicateIds }),
    });
  }

  async bulkLabelDuplicates(duplicateIds: number[], label: string): Promise<void> {
    await this.request<{ message: string }>('/duplicates/bulk-label', {
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
    try {
      const response = await this.request<any>(`/reviews/${reviewId}/members`);
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

  // Settings Methods
  async getSettings() {
    // DISABLED: Return static defaults to prevent reload loops
    // The branding system now uses localStorage only
    return {
      website_name: 'Research Nexus',
      logo_url: '/logo-static.png',
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
}

export const api = new ApiClient(API_URLS);
export default api;

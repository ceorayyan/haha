/**
 * TypeScript interfaces for the Enhanced Duplicate Detection System
 * 
 * These interfaces define the data structures used for duplicate detection,
 * pagination, status tracking, and API responses.
 */

/**
 * Represents a duplicate pair of articles
 */
export interface Duplicate {
  id: number;
  review_id: number;
  article1_id: number;
  article2_id: number;
  article1_title: string;
  article2_title: string;
  article1_authors?: string;
  article2_authors?: string;
  article1_created_at: string;
  article2_created_at: string;
  similarity_score: number;
  detection_reason: string;
  status: 'unresolved' | 'deleted' | 'not_duplicate' | 'resolved';
  marked_by_user_id?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Paginated response for duplicate listings
 */
export interface PaginatedDuplicates {
  data: Duplicate[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

/**
 * Counts of duplicates grouped by status
 */
export interface StatusCounts {
  unresolved: number;
  deleted: number;
  not_duplicate: number;
  resolved: number;
  total: number;
}

/**
 * Response from duplicate detection operation
 */
export interface DetectionResponse {
  message: string;
  data: {
    duplicates: Duplicate[];
    total_duplicates: number;
    execution_time: string;
    articles_checked: number;
    partial: boolean;
    incremental?: boolean;
  };
}

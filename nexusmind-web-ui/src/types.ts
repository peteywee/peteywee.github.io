// src/types.ts

// --- User & Auth Types ---
export interface User {
  username: string;
  full_name?: string;
  email?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean; // Renamed from 'loading' for clarity
  user: User | null;
  login: (token: string, username: string) => void;
  logout: () => void;
  isLoading: boolean; // Existing loading state for async operations
}

// --- File Uploader Types ---
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadedFile {
  id: string;
  name: string;
  size: number; // in bytes
  type: string; // file extension, e.g., 'pdf', 'txt'
  uploadedAt: string; // ISO 8601 string
  status: 'processing' | 'completed' | 'failed';
  error?: string; // If processing failed
}

export interface FileUploadResponse {
  message: string;
  files: UploadedFile[];
}

// --- Search Types ---
export interface SearchFilters {
  fileTypes: string[];
  dateRange: { start: string; end: string } | null;
  sortBy: 'relevance' | 'date' | 'name';
}

export interface SearchResultItem {
  id: string;
  title: string;
  excerpt: string; // Short snippet of content
  fileType: string;
  fileSize: number; // Corrected to number as per formatFileSize function
  lastModified: string; // ISO 8601 string
  relevanceScore: number; // 0.0 - 1.0
  author?: string;
  tags?: string[];
  path?: string; // Original file path/location
}

export interface SearchResult {
  items: SearchResultItem[];
  total: number;
  page: number;
  perPage: number;
  searchTime?: number; // in milliseconds
}

// --- API Client Types (for nexusAPI.ts) ---
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

// src/api/nexusAPI.ts
import axios from 'axios';
import Cookies from 'js-cookie';
import { LoginCredentials, LoginResponse, User, FileUploadResponse, UploadedFile, SearchResult } from '../types';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

const nexusAPI = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

nexusAPI.interceptors.request.use(config => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

nexusAPI.interceptors.response.use(response => response, error => {
  if (error.response && error.response.status === 401) {
    Cookies.remove('access_token');
    localStorage.removeItem('nexus_username');
    // Dispatch custom event for AuthProvider to handle global logout
    const authEvent = new CustomEvent('authError');
    window.dispatchEvent(authEvent);
  }
  return Promise.reject(error);
});

// --- API Service Functions ---
export const nexusService = { // Renamed to nexusService for better structure if you export this
  login: async (credentials: LoginCredentials): Promise<User> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    const response = await nexusAPI.post<LoginResponse>('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // Assuming login endpoint returns token, and we then fetch user info
    const userResponse = await nexusAPI.get<User>('/auth/me');
    return userResponse.data;
  },

  logout: async () => {
    // For JWTs, logout is often client-side (clearing token)
    // If your backend has a /logout endpoint for token invalidation, call it here:
    // await nexusAPI.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await nexusAPI.get<User>('/auth/me');
    return response.data;
  },

  // File operations
  uploadFiles: async (files: File[], onProgress: (progress: number) => void): Promise<FileUploadResponse> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file); // Use 'files' as the field name for multiple files
    });

    const userId = localStorage.getItem('nexus_username'); // Assuming username is still accessible or passed from context
    if (!userId) {
      throw new Error("User ID not available for upload.");
    }

    const response = await nexusAPI.post<FileUploadResponse>(`/ingest/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  getUploadedFiles: async (): Promise<UploadedFile[]> => {
    const userId = localStorage.getItem('nexus_username'); // Assuming username is still accessible
    if (!userId) {
      throw new Error("User ID not available for fetching files.");
    }
    // This endpoint will need to be implemented on the backend
    const response = await nexusAPI.get<UploadedFile[]>(`/files/${userId}`); 
    return response.data;
  },

  deleteFiles: async (fileIds: string[]): Promise<{ message: string }> => {
    const userId = localStorage.getItem('nexus_username'); // Assuming username is still accessible
    if (!userId) {
      throw new Error("User ID not available for deleting files.");
    }
    // This endpoint will need to be implemented on the backend
    const response = await nexusAPI.post<{ message: string }>(`/files/${userId}/delete`, { file_ids: fileIds });
    return response.data;
  },

  reprocessFile: async (fileId: string): Promise<{ message: string }> => {
    const userId = localStorage.getItem('nexus_username'); // Assuming username is still accessible
    if (!userId) {
      throw new Error("User ID not available for reprocessing.");
    }
    // This endpoint will need to be implemented on the backend
    const response = await nexusAPI.post<{ message: string }>(`/files/${userId}/reprocess`, { file_id: fileId });
    return response.data;
  },

  // Search operations
  search: async (query: string, filters?: any): Promise<SearchResult> => { // Use 'any' for filters for now
    const userId = localStorage.getItem('nexus_username'); // Assuming username is still accessible
    if (!userId) {
      throw new Error("User ID not available for search.");
    }
    const response = await nexusAPI.post<SearchResult>('/query', { query, user_id: userId, filters });
    return response.data;
  },

  // Other APIs if needed
};

// Export nexusAPI directly for general use (e.g., interceptors)
export { nexusAPI };

// Export nexusService functions for components to use
export default nexusService; // Default export for convenience

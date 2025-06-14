#!/bin/bash

set -euo pipefail

# === Colors ===
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No color

# === Helper logging ===
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# === Ensure directory exists ===
ensure_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir" && log_success "Created directory: $dir" || {
      log_error "Failed to create directory: $dir"
      exit 1
    }
  else
    log_info "Directory exists: $dir"
  fi
}

# === Ensure all folders ===
ensure_dir src
ensure_dir src/pages
ensure_dir src/components
ensure_dir src/api

# === Create App.tsx ===
cat << 'EOF' > src/App.tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { IngestPage } from './pages/IngestPage';
import { QueryPage } from './pages/QueryPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './components/AuthProvider';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <p className="text-center mt-20 text-gray-600">Loading authentication...</p>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

const AppContent: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <ul className="flex space-x-8">
          <li><Link to="/ingest" className="text-blue-600 hover:text-blue-800 text-lg font-medium">Ingest</Link></li>
          <li><Link to="/query" className="text-blue-600 hover:text-blue-800 text-lg font-medium">Query</Link></li>
        </ul>
        {isAuthenticated && user ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Welcome, {user.username}!</span>
            <button onClick={logout} className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm">Logout</button>
          </div>
        ) : (
          <Link to="/login" className="text-blue-600 hover:text-blue-800 text-lg font-medium">Login</Link>
        )}
      </nav>
      <main className="py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ingest" element={<PrivateRoute><IngestPage /></PrivateRoute>} />
          <Route path="/query" element={<PrivateRoute><QueryPage /></PrivateRoute>} />
          <Route path="/" element={isAuthenticated ? <Navigate to="/ingest" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
EOF
log_success "Generated: src/App.tsx"

# === Create IngestPage.tsx ===
cat << 'EOF' > src/pages/IngestPage.tsx
// src/pages/IngestPage.tsx
import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import nexusAPI from '../api/nexusAPI';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../components/AuthProvider';

export const IngestPage: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner message="Loading user data..." />;
  if (!isAuthenticated || !user) return <p className="text-center mt-20 text-red-500">Not authenticated. Please log in.</p>;

  const handleFileUpload = async (file: File) => {
    setUploadStatus('uploading');
    setError('');
    setTaskId(null);

    const formData = new FormData();
    formData.append('file', file);
    const userId = user.username;

    try {
      const response = await nexusAPI.post(`/ingest/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('success');
      setTaskId(response.data.task_id);
    } catch (err: any) {
      setUploadStatus('error');
      setError(err.response?.data?.detail || 'An unknown error occurred during upload.');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Ingest Knowledge Archive</h1>
      <p className="mb-4 text-gray-600">Logged in as: <span className="font-semibold">{user.username}</span></p>
      <FileUploader onFileUpload={handleFileUpload} disabled={uploadStatus === 'uploading'} />
      {uploadStatus === 'uploading' && <Spinner message="Uploading and processing..." />}
      {uploadStatus === 'success' && <p className="mt-4 text-green-600 text-center">File accepted! Task ID: <span className="font-mono">{taskId}</span></p>}
      {uploadStatus === 'error' && <p className="mt-4 text-red-600 text-center">Error: {error}</p>}
    </div>
  );
};
EOF
log_success "Generated: src/pages/IngestPage.tsx"

# === Create QueryPage.tsx ===
cat << 'EOF' > src/pages/QueryPage.tsx
// src/pages/QueryPage.tsx
import React, { useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { ResultsDisplay } from '../components/ResultsDisplay';
import nexusAPI from '../api/nexusAPI';
import { useAuth } from '../components/AuthProvider';
import { Spinner } from '../components/Spinner';

interface QueryApiResponse {
  answer: string;
  context: string[];
}

export const QueryPage: React.FC = () => {
  const [queryState, setQueryState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    data: QueryApiResponse | null;
    error: string | null;
  }>({ status: 'idle', data: null, error: null });

  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner message="Loading user data..." />;
  if (!isAuthenticated || !user) return <p className="text-center mt-20 text-red-500">Not authenticated. Please log in.</p>;

  const handleSearch = async (query: string) => {
    setQueryState({ status: 'loading', data: null, error: null });
    const userId = user.username;

    try {
      const response = await nexusAPI.post<QueryApiResponse>('/query', { query, user_id: userId });
      setQueryState({ status: 'success', data: response.data, error: null });
    } catch (err: any) {
      setQueryState({
        status: 'error',
        data: null,
        error: err.response?.data?.detail || 'Failed to get answer.',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Query Your NexusMind</h1>
      <p className="mb-4 text-gray-600">Querying as: <span className="font-semibold">{user.username}</span></p>
      <SearchBar onSearch={handleSearch} disabled={queryState.status === 'loading'} />
      <ResultsDisplay state={queryState} />
    </div>
  );
};
EOF
log_success "Generated: src/pages/QueryPage.tsx"

# === Install ESLint if needed ===
if ! command -v npx &> /dev/null; then
  log_error "npx not found. Please install Node.js and npm first."
  exit 1
fi

log_info "Setting up ESLint strict mode..."
npx eslint --init || log_warn "ESLint setup skipped (might already exist)"

# === Run ESLint Fix ===
npx eslint src --ext .tsx,.ts --fix || log_warn "ESLint fix had warnings or errors"

log_success "Scaffold complete."

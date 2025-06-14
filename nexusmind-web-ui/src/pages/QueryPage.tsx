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

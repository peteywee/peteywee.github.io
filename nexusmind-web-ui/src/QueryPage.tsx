import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import ResultsDisplay from '../components/ResultsDisplay';
import { FileMetadataResponse, FileSearchRequest, FileSearchResult } from '../types';
import nexusService from '../services/nexusService';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const QueryPage: React.FC = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<FileMetadataResponse[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSearchRequest, setCurrentSearchRequest] = useState<FileSearchRequest>({
    query: '',
    limit: 10,
    offset: 0,
    // Add other default filter values here if necessary
  });

  const performSearch = useCallback(async (searchRequest: FileSearchRequest) => {
    if (!user) {
      setError('Please log in to perform searches.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response: FileSearchResult = await nexusService.files.searchFiles(searchRequest);
      setSearchResults(response.files);
      setTotalResults(response.total_results);
      setCurrentSearchRequest(searchRequest); // Store the request that yielded these results
    } catch (err: any) {
      console.error('Error performing search:', err);
      setError(err.response?.data?.detail || 'Failed to perform search.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial search or search on filter changes
  useEffect(() => {
    // Perform an initial empty search to show all files for the user
    // Or you can choose to only search when the user types something
    if (user) {
      performSearch(currentSearchRequest);
    }
  }, [user, performSearch, currentSearchRequest.limit, currentSearchRequest.offset]); // Re-run if user changes or pagination changes

  const handleSearchSubmit = (query: string) => {
    const newSearchRequest = { ...currentSearchRequest, query, offset: 0 }; // Reset offset on new query
    performSearch(newSearchRequest);
  };

  const handlePagination = (newOffset: number) => {
    const newSearchRequest = { ...currentSearchRequest, offset: newOffset };
    performSearch(newSearchRequest);
  };

  // Example of adding filter functionality:
  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value === 'all' ? undefined : event.target.value;
    const newSearchRequest = { ...currentSearchRequest, status: newStatus, offset: 0 };
    performSearch(newSearchRequest);
  };

  const totalPages = Math.ceil(totalResults / (currentSearchRequest.limit || 1)); // Default limit to 1 to avoid division by zero

  return (
    <div className="min-h-screen bg-gray-100 p-8 rounded-lg shadow-lg flex flex-col items-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Query NexusMind</h1>

      {user && (
        <p className="text-xl text-gray-600 mb-6">
          Hello, {user.username}! Search through your ingested data.
        </p>
      )}

      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between mb-6">
        <SearchBar onSubmit={handleSearchSubmit} initialQuery={currentSearchRequest.query || ''} />
        <div className="mt-4 md:mt-0 md:ml-4">
          <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
          <select
            id="status-filter"
            name="status-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={currentSearchRequest.status || 'all'}
            onChange={handleStatusFilterChange}
          >
            <option value="all">All Statuses</option>
            <option value="uploaded">Uploaded</option>
            <option value="processing">Processing</option>
            <option value="processed">Processed</option>
            <option value="failed">Failed</option>
            <option value="enqueued_for_reprocessing">Reprocessing</option>
          </select>
        </div>
      </div>

      {loading && <Spinner />}
      {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}

      {searchResults.length > 0 && (
        <div className="w-full max-w-4xl mt-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Search Results ({totalResults})</h2>
          <ResultsDisplay results={searchResults} />

          {/* Pagination Controls */}
          {totalResults > (currentSearchRequest.limit || 1) && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => handlePagination(Math.max(0, (currentSearchRequest.offset || 0) - (currentSearchRequest.limit || 1)))}
                disabled={(currentSearchRequest.offset || 0) === 0 || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {Math.floor((currentSearchRequest.offset || 0) / (currentSearchRequest.limit || 1)) + 1} of {totalPages}
              </span>
              <button
                onClick={() => handlePagination((currentSearchRequest.offset || 0) + (currentSearchRequest.limit || 1))}
                disabled={((currentSearchRequest.offset || 0) + (currentSearchRequest.limit || 1)) >= totalResults || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {searchResults.length === 0 && !loading && !error && user && (
        <p className="text-gray-500 text-center mt-6">No search results found. Try a different query or filters.</p>
      )}
      {!user && !loading && <p className="text-gray-500 text-center mt-6">Please log in to search files.</p>}
    </div>
  );
};

export default QueryPage;

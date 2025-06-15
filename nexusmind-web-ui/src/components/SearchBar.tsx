import React, { useState, useEffect } from 'react';
import { Search, X, Filter, Clock } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce'; // Assuming this hook is created
import { SearchFilters } from '../types';

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onClear?: () => void;
  placeholder?: string;
  loading?: boolean;
  recentSearches?: string[];
  onRecentSearchSelect?: (search: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onClear,
  placeholder = "Search your documents...",
  loading = false,
  recentSearches = [],
  onRecentSearchSelect
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    fileTypes: [],
    dateRange: null,
    sortBy: 'relevance'
  });
  
  const debouncedQuery = useDebounce(query, 300); // Using useDebounce hook

  useEffect(() => {
    // Only trigger search if debouncedQuery is not empty after debounce
    // And ensure onSearch is called only when the debounced query is ready
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery, filters);
    } else if (!query.trim()) { // If query becomes empty, clear results via onClear
      onClear?.();
    }
  }, [debouncedQuery, filters, onSearch, onClear, query]); // Added query to dependencies to detect instant clear

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Debounce will handle calling onSearch for non-empty queries
    // If the input is cleared, onClear will be called due to useEffect dependency
  };

  const handleClear = () => {
    setQuery('');
    // onClear will be called by useEffect after query becomes empty
    setShowRecentSearches(false);
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
    onRecentSearchSelect?.(search);
    setShowRecentSearches(false);
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const hasActiveFilters = filters.fileTypes.length > 0 || filters.dateRange !== null;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 ${loading ? 'animate-pulse' : ''} text-gray-400`} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowRecentSearches(recentSearches.length > 0 && !query.trim())} // Show only if query empty
          onBlur={() => setTimeout(() => setShowRecentSearches(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          disabled={loading}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              hasActiveFilters ? 'text-blue-600' : 'text-gray-400'
            }`}
            title="Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          
          {query && (
            <button
              onClick={handleClear}
              className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Recent Searches Dropdown */}
      {showRecentSearches && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              Recent searches
            </div>
            {recentSearches.slice(0, 5).map((search, index) => (
              <button
                key={index}
                onClick={() => handleRecentSearchClick(search)}
                className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm text-gray-700"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Types
              </label>
              <div className="flex flex-wrap gap-2">
                {['PDF', 'DOC', 'TXT', 'PPT'].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const newTypes = filters.fileTypes.includes(type)
                        ? filters.fileTypes.filter(t => t !== type)
                        : [...filters.fileTypes, type];
                      handleFilterChange({ fileTypes: newTypes });
                    }}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters.fileTypes.includes(type)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Date Range Filter (Placeholder) */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <input type="date" className="w-full p-2 border border-gray-300 rounded"
                     onChange={(e) => handleFilterChange({ dateRange: { start: e.target.value, end: '' } })} />
            </div> */}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as 'relevance' | 'date' | 'name' })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date Modified</option>
                <option value="name">Name</option>
              </select>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ fileTypes: [], dateRange: null, sortBy: 'relevance' })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

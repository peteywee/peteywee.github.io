import React, { useState } from 'react';

interface SearchBarProps {
  onSubmit: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSubmit, initialQuery = '', placeholder = 'Search files...' }) => {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md rounded-md shadow-sm">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      <button
        type="submit"
        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;

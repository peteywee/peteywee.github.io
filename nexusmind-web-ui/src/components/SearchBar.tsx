// src/components/SearchBar.tsx
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, disabled, placeholder = "Ask a question..." }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-grow p-2 border rounded-md"
      />
      <button type="submit" disabled={disabled} className="bg-blue-600 text-white px-4 py-2 rounded-md">
        Search
      </button>
    </form>
  );
};
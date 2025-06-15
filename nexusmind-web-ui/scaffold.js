// scaffold.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the component scaffold manifest
const manifest = {
  components: [
    {
      name: 'FileUploader',
      path: 'src/components/FileUploader.tsx',
      content: `// src/components/FileUploader.tsx
import React, { useState } from 'react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  disabled: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, disabled }) => {
  const [highlight, setHighlight] = useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlight(false);
    if (e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div
      className={\`border-2 border-dashed p-8 text-center \${highlight ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} \${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}\`}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setHighlight(true)}
      onDragLeave={() => setHighlight(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && document.getElementById('file-input')?.click()}
    >
      <input id="file-input" type="file" className="hidden" onChange={handleFileSelect} disabled={disabled} accept=".zip" />
      <p>{disabled ? 'Processing...' : 'Drop or click to upload .zip file'}</p>
    </div>
  );
};`
    },
    {
      name: 'SearchBar',
      path: 'src/components/SearchBar.tsx',
      content: `// src/components/SearchBar.tsx
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
};`
    },
    {
      name: 'ResultsDisplay',
      path: 'src/components/ResultsDisplay.tsx',
      content: `// src/components/ResultsDisplay.tsx
import React from 'react';

interface QueryResult {
  answer: string;
  context: string[];
}

interface ResultsDisplayProps {
  state: {
    status: 'idle' | 'loading' | 'success' | 'error';
    data: QueryResult | null;
    error: string | null;
  };
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ state }) => {
  if (state.status === 'loading') return <p>Loading...</p>;
  if (state.status === 'error') return <p>Error: {state.error}</p>;
  if (state.status === 'success' && state.data) {
    return (
      <div>
        <h2>Answer:</h2>
        <p>{state.data.answer}</p>
        <h3>Context:</h3>
        <ul>
          {state.data.context.map((ctx, i) => <li key={i}>{ctx}</li>)}
        </ul>
      </div>
    );
  }
  return null;
};`
    },
    {
      name: 'Spinner',
      path: 'src/components/Spinner.tsx',
      content: `// src/components/Spinner.tsx
import React from 'react';

interface SpinnerProps {
  message?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
      <span className="ml-4 text-blue-700">{message}</span>
    </div>
  );
};`
    }
  ]
};

(async () => {
  for (const component of manifest.components) {
    const fullPath = path.join(__dirname, component.path);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, component.content, 'utf8');
    console.log(`✅ Created: ${component.path}`);
  }
})();

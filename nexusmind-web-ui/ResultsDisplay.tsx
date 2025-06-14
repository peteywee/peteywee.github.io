// src/components/ResultsDisplay.tsx
import React from 'react';

interface QueryResult {
  answer: string;
  context: string[]; // Array of source documents/conversation snippets
}

interface ResultsDisplayProps {
  state: {
    status: 'idle' | 'loading' | 'success' | 'error';
    data: QueryResult | null;
    error: string | null;
  };
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ state }) => {
  if (state.status === 'loading') {
    return <p className="mt-4 text-center">Loading answer...</p>; // Potentially use Spinner.tsx here
  }

  if (state.status === 'error') {
    return <p className="mt-4 text-red-600">Error: {state.error}</p>;
  }

  if (state.status === 'success' && state.data) {
    return (
      <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Answer:</h2>
        <p className="text-gray-800 mb-4">{state.data.answer}</p>

        {state.data.context && state.data.context.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Source Context:</h3>
            <ul className="list-disc list-inside text-gray-700">
              {state.data.context.map((src, index) => (
                <li key={index} className="mb-1 text-sm">
                  {/* In a real app, 'src' would be a link or ID to the original document/chat */}
                  <span className="font-mono bg-gray-100 p-1 rounded text-xs">{src}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return null; // idle state
};

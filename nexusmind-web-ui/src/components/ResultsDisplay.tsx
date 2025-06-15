// src/components/ResultsDisplay.tsx
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
};
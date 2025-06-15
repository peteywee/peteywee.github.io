// src/components/Spinner.tsx
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
};
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'gray' | 'current'; // Added 'current' for currentColor
  className?: string;
  message?: string; // Added message for contextual spinner
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  message // Destructure message
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600',
    current: 'text-current' // For inheriting text color
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}> {/* Flex container for message */}
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>} {/* Display message if provided */}
    </div>
  );
};

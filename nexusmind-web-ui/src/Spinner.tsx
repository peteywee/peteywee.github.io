import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center my-4">
      <div
        className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;

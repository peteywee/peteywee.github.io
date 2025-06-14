// src/components/FileUploader.tsx
import React, { useState, useCallback } from 'react';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  disabled: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload, disabled }) => {
  const [highlight, setHighlight] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlight(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlight(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlight(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlight(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileUpload(file);
      e.dataTransfer.clearData();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileUpload(file);
    }
  };

  return (
    <div
      className={`border-2 border-dashed p-8 text-center transition-colors duration-200
        ${highlight ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragEnter={!disabled ? handleDragEnter : undefined}
      onDragOver={!disabled ? handleDragOver : undefined}
      onDragLeave={!disabled ? handleDragLeave : undefined}
      onDrop={!disabled ? handleDrop : undefined}
      onClick={() => !disabled && document.getElementById('file-input')?.click()}
    >
      <input
        type="file"
        id="file-input"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
        accept=".zip"
      />
      <p className="text-gray-600">
        {disabled ? 'Processing...' : 'Drag & drop your .zip archive here, or click to select.'}
      </p>
    </div>
  );
};

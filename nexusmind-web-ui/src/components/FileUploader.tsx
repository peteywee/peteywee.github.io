// src/components/FileUploader.tsx
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
      className={`border-2 border-dashed p-8 text-center ${highlight ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
};
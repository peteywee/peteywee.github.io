import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle } from 'lucide-react';
import { nexusService } from '../api/nexusAPI'; // Corrected import to use nexusService
import { UploadStatus, FileUploadResponse } from '../types';
import { Spinner } from './Spinner';

interface FileUploaderProps {
  onUploadComplete?: (response: FileUploadResponse) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFileSize?: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  acceptedTypes = ['.pdf', '.txt', '.doc', '.docx'],
  maxFileSize = 10 * 1024 * 1024 // 10MB
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(extension)) {
      return `File type ${extension} not supported`;
    }
    if (file.size > maxFileSize) {
      return `File size exceeds ${maxFileSize / 1024 / 1024}MB limit`;
    }
    return null;
  };

  const handleFiles = (fileList: FileList) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join(', '));
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploadStatus('uploading');
    setProgress(0);

    try {
      // Use nexusService.uploadFiles from the new API structure
      const response = await nexusService.uploadFiles(files, (currentProgress) => {
        setProgress(currentProgress);
      });
      
      setUploadStatus('success');
      onUploadComplete?.(response);
      setFiles([]); // Clear files after successful upload
    } catch (error) {
      setUploadStatus('error');
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Spinner size="sm" />; // Assuming Spinner can take a size prop
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Upload className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-2">
          {getStatusIcon()}
          <p className="text-gray-600">
            {uploadStatus === 'uploading' ? 'Uploading...' : 'Drag & drop files here or click to browse'}
          </p>
          <p className="text-sm text-gray-400">
            Supported: {acceptedTypes.join(', ')} • Max: {maxFileSize / 1024 / 1024}MB
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-gray-700">Selected Files:</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <File className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadStatus === 'uploading' && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">{progress}% complete</p>
        </div>
      )}

      {files.length > 0 && uploadStatus !== 'uploading' && (
        <button
          onClick={uploadFiles}
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload {files.length} file{files.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  );
};

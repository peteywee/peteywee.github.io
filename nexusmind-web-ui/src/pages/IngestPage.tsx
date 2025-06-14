// src/pages/IngestPage.tsx
import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import nexusAPI from '../api/nexusAPI';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../components/AuthProvider';

export const IngestPage: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <Spinner message="Loading user data..." />;
  if (!isAuthenticated || !user) return <p className="text-center mt-20 text-red-500">Not authenticated. Please log in.</p>;

  const handleFileUpload = async (file: File) => {
    setUploadStatus('uploading');
    setError('');
    setTaskId(null);

    const formData = new FormData();
    formData.append('file', file);
    const userId = user.username;

    try {
      const response = await nexusAPI.post(`/ingest/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus('success');
      setTaskId(response.data.task_id);
    } catch (err: any) {
      setUploadStatus('error');
      setError(err.response?.data?.detail || 'An unknown error occurred during upload.');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Ingest Knowledge Archive</h1>
      <p className="mb-4 text-gray-600">Logged in as: <span className="font-semibold">{user.username}</span></p>
      <FileUploader onFileUpload={handleFileUpload} disabled={uploadStatus === 'uploading'} />
      {uploadStatus === 'uploading' && <Spinner message="Uploading and processing..." />}
      {uploadStatus === 'success' && <p className="mt-4 text-green-600 text-center">File accepted! Task ID: <span className="font-mono">{taskId}</span></p>}
      {uploadStatus === 'error' && <p className="mt-4 text-red-600 text-center">Error: {error}</p>}
    </div>
  );
};

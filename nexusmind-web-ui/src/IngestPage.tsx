import React, { useState, useEffect, useCallback } from 'react';
import FileUploader from '../components/FileUploader';
import { FileMetadataResponse, FileListResponse } from '../types';
import nexusService from '../services/nexusService';
import { formatDate, formatFileSize, truncateText } from '../utils/helpers'; // Assuming these helpers exist
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const IngestPage: React.FC = () => {
  const { user } = useAuth(); // Get current user for display, if needed
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadataResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const filesPerPage = 10;

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response: FileListResponse = await nexusService.files.getUploadedFiles(
        page * filesPerPage,
        filesPerPage
      );
      setUploadedFiles(response.files);
      setTotalFiles(response.total_count);
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setError(err.response?.data?.detail || 'Failed to fetch uploaded files.');
    } finally {
      setLoading(false);
    }
  }, [page, filesPerPage]);

  useEffect(() => {
    if (user) { // Only fetch files if user is logged in
      fetchFiles();
    }
  }, [user, fetchFiles]);

  const handleFileUpload = async (acceptedFiles: File[]) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      for (const file of acceptedFiles) {
        const response = await nexusService.files.uploadFile(file);
        setMessage(`File "${response.filename}" uploaded and enqueued for processing!`);
        // Refresh the list after upload
        await fetchFiles();
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.detail || 'Failed to upload file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await nexusService.files.deleteFile(fileId);
      setMessage(response.message);
      await fetchFiles(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting file:', err);
      setError(err.response?.data?.detail || 'Failed to delete file.');
    } finally {
      setLoading(false);
    }
  };

  const handleReprocessFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to reprocess this file?')) {
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await nexusService.files.reprocessFile(fileId);
      setMessage(response.message);
      await fetchFiles(); // Refresh the list to show status change
    } catch (err: any) {
      console.error('Error reprocessing file:', err);
      setError(err.response?.data?.detail || 'Failed to reprocess file.');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalFiles / filesPerPage);

  return (
    <div className="min-h-screen bg-gray-100 p-8 rounded-lg shadow-lg flex flex-col items-center">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Ingest Data</h1>

      {user && (
        <p className="text-xl text-gray-600 mb-6">
          Welcome, {user.username}! Upload your documents here.
        </p>
      )}

      <FileUploader onFileUpload={handleFileUpload} />

      {loading && <Spinner />}
      {error && <p className="text-red-500 mt-4 text-center font-semibold">{error}</p>}
      {message && <p className="text-green-600 mt-4 text-center font-semibold">{message}</p>}

      <div className="w-full max-w-4xl mt-10 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Your Uploaded Files ({totalFiles})</h2>
        {uploadedFiles.length === 0 && !loading && (
          <p className="text-gray-500 text-center">No files uploaded yet.</p>
        )}

        {uploadedFiles.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded On</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {uploadedFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {truncateText(file.filename, 40)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {file.mime_type || 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          file.status === 'processed' ? 'bg-green-100 text-green-800' :
                          file.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          file.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                      }`}>
                        {file.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.upload_timestamp)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-900 mr-3 px-3 py-1 rounded-md border border-red-600 hover:bg-red-50 transition-colors duration-200"
                        disabled={loading}
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleReprocessFile(file.id)}
                        className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded-md border border-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                        disabled={loading || file.status === 'processing' || file.status === 'enqueued_for_reprocessing'}
                      >
                        Reprocess
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalFiles > filesPerPage && (
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0 || loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={page === totalPages - 1 || loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngestPage;

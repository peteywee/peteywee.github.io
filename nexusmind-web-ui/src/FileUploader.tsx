import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone'; // Make sure react-dropzone is installed: npm install react-dropzone

interface FileUploaderProps {
  onFileUpload: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setErrorMessage(null); // Clear previous errors

    if (fileRejections.length > 0) {
      // Handle file rejections (e.g., too large, wrong type)
      const rejectedFileNames = fileRejections.map(fr => fr.file.name).join(', ');
      setErrorMessage(`Some files were rejected: ${rejectedFileNames}. Please check file size and type.`);
      console.error('File rejections:', fileRejections);
    }

    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles); // Pass accepted files to the parent component
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple: true, // Allow multiple files
    maxSize: 10 * 1024 * 1024, // 10 MB limit (adjust as needed)
    // You can add `accept` property if you want to restrict file types
    // accept: {
    //   'application/pdf': ['.pdf'],
    //   'text/plain': ['.txt'],
    //   'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    // },
  });

  return (
    <div
      {...getRootProps()}
      className={`w-full max-w-xl p-8 border-2 border-dashed rounded-lg text-center cursor-pointer
        transition-all duration-300
        ${isDragActive && !isDragReject ? 'border-indigo-500 bg-indigo-50 text-indigo-700' :
          isDragReject ? 'border-red-500 bg-red-50 text-red-700' :
          'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
        }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        isDragReject ? (
          <p className="text-red-700 font-semibold">Some files will be rejected!</p>
        ) : (
          <p className="text-indigo-700 font-semibold">Drop the files here ...</p>
        )
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
      <p className="text-xs mt-2">(Max 10MB per file, multiple files allowed)</p>
      {errorMessage && (
        <p className="text-red-500 mt-4 text-sm font-medium">{errorMessage}</p>
      )}
    </div>
  );
};

export default FileUploader;

import React, { useState } from "react";
import { FileUploader } from "../components/FileUploader";
import nexusAPI from "../api/nexusAPI";
import { Spinner } from "../components/Spinner";

const IngestPage = () => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      await nexusAPI.uploadFile(file);
      alert("File uploaded successfully");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Ingest File</h1>
      {loading ? <Spinner /> : <FileUploader onUpload={handleUpload} />}
    </div>
  );
};

export default IngestPage;

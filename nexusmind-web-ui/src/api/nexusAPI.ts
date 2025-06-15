const nexusAPI = {
  uploadFile: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.statusText}`);
    }
  },
};

export default nexusAPI;

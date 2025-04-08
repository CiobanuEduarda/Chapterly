"use client"
import React, { useState, useEffect, useRef } from 'react';

interface FileInfo {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  uploadDate?: Date;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch existing files
  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
      alert('Failed to load files');
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Handle file selection
  const handleFiles = async (files: FileList) => {
    setUploading(true);
    
    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }
        };

        // Handle upload completion
        xhr.onload = async () => {
          if (xhr.status === 200) {
            alert(`${file.name} uploaded successfully`);
            await fetchFiles();
            setUploadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[file.name];
              return newProgress;
            });
          } else {
            alert(`Failed to upload ${file.name}`);
          }
        };

        xhr.onerror = () => {
          alert(`Network error while uploading ${file.name}`);
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        };

        // Set headers
        xhr.open('POST', 'http://localhost:3001/api/upload');
        xhr.setRequestHeader('X-File-Name', file.name);
        xhr.send(formData);
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }
    
    setUploading(false);
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Handle button click
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  // Handle file download
  const handleDownload = async (filename: string) => {
    try {
      window.open(`http://localhost:3001/api/download/${filename}`, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  // Handle file deletion
  const handleDelete = async (filename: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/files/${filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('File deleted successfully');
        await fetchFiles();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#89A593] p-8">
      <h1 className="text-3xl font-bold bg-[#52796F] p-6 rounded-md shadow-md text-center text-[#042405]">
        File Management
      </h1>

      {/* Upload Area */}
      <div
        className={`mt-8 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer relative
          ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <p className="text-lg text-[#042405]">
          {dragActive
            ? "Drop the files here..."
            : "Drag and drop files here, or click to select files"}
        </p>
      </div>

      {/* File List */}
      <div className="mt-8 bg-[#E1A591] rounded-md shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-[#042405]">Uploaded Files</h2>
        <div className="space-y-4">
          {files.map((file) => (
            <div
              key={file.filename}
              className="flex items-center justify-between bg-white p-4 rounded-md shadow"
            >
              <div className="flex-1">
                <p className="font-semibold text-[#042405]">{file.originalName || file.filename}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)} • {new Date(file.uploadDate!).toLocaleString()}
                </p>
                {uploadProgress[file.filename] !== undefined && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-[#52796F] h-2.5 rounded-full"
                      style={{ width: `${uploadProgress[file.filename]}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(file.filename)}
                  className="px-3 py-1 bg-[#52796F] text-white rounded-md hover:bg-[#446157]"
                >
                  Download
                </button>
                <button
                  onClick={() => handleDelete(file.filename)}
                  className="px-3 py-1 bg-[#C76E77] text-white rounded-md hover:bg-[#b55c64]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {files.length === 0 && (
            <p className="text-center text-gray-500">No files uploaded yet</p>
          )}
        </div>
      </div>
    </div>
  );
} 
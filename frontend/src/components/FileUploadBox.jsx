import React, { useRef, useState } from "react";
import { FiUploadCloud, FiFileText, FiTrash2, FiDownload } from "react-icons/fi";

function FileUploadBox({ title, type, icon, uploads, onUpload, onDelete }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const inputRef = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    // Simulate progress (replace with real upload progress if available)
    const fakeProgress = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(fakeProgress);
          return p;
        }
        return p + 10;
      });
    }, 100);
    await onUpload(file, setProgress);
    clearInterval(fakeProgress);
    setProgress(100);
    setTimeout(() => setUploading(false), 400);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploading(true);
      setProgress(0);
      const file = e.dataTransfer.files[0];
      await onUpload(file, setProgress);
      setProgress(100);
      setTimeout(() => setUploading(false), 400);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col gap-4 border border-gray-200 dark:border-gray-700 w-full max-w-xs mx-auto transition-all duration-200 ${dragActive ? "ring-2 ring-blue-400" : ""}`}
      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</span>
      </div>
      <div
        className={`flex flex-col items-center justify-center border-2 border-dashed ${dragActive ? "border-blue-400" : "border-gray-300 dark:border-gray-600"} rounded-lg p-6 cursor-pointer bg-gray-50 dark:bg-gray-800 transition-all`}
        onClick={() => inputRef.current.click()}
        tabIndex={0}
        role="button"
        aria-label={`Upload ${title}`}
      >
        <FiUploadCloud className="text-3xl text-blue-400 mb-2" />
        <span className="text-gray-600 dark:text-gray-200 text-sm font-medium">Drag & drop or click to upload</span>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          ref={inputRef}
          onChange={handleFileChange}
        />
      </div>
      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      <div className="mt-2">
        {uploads.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">No {title.toLowerCase()} uploaded yet.</div>
        ) : (
          <ul className="space-y-2">
            {uploads.map((u) => (
              <li key={u._id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                <FiFileText className="text-blue-400" />
                <span className="flex-1 truncate text-xs text-gray-700 dark:text-gray-200 font-medium">{u.filename}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{(u.size ? (u.size / 1024).toFixed(1) : "")} KB</span>
                <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs"><FiDownload /></a>
                <button
                  className="text-red-500 hover:text-red-700 text-xs"
                  onClick={() => { setDeleteId(u._id); setShowDeleteModal(true); }}
                  aria-label="Delete file"
                >
                  <FiTrash2 />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-full max-w-sm">
            <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Delete File?</h4>
            <p className="mb-4 text-gray-700 dark:text-gray-200 font-medium">Are you sure you want to delete this file? This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => { setShowDeleteModal(false); setDeleteId(null); }}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                onClick={() => { onDelete(deleteId); setShowDeleteModal(false); setDeleteId(null); }}
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUploadBox; 
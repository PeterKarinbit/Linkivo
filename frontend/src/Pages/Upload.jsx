import React, { useState, useEffect, useRef } from "react";
import { userService } from "../services/userService";
import { FiFileText, FiBriefcase, FiFolder, FiGrid, FiDownload, FiTrash2, FiUploadCloud, FiCheck, FiAlertCircle } from "react-icons/fi";
import StepperTabs from "../components/SkillGapAnalyzer/StepperTabs";

const UPLOAD_TYPES = [
  { 
    type: "resume", 
    title: "Resume", 
    icon: <FiFileText className="text-2xl" />,
    description: "Upload your current resume for AI analysis",
    acceptedFormats: "PDF, DOC, DOCX"
  },
  { 
    type: "cv", 
    title: "CV", 
    icon: <FiBriefcase className="text-2xl" />,
    description: "Upload your comprehensive curriculum vitae",
    acceptedFormats: "PDF, DOC, DOCX"
  },
  { 
    type: "portfolio", 
    title: "Portfolio", 
    icon: <FiFolder className="text-2xl" />,
    description: "Showcase your work and projects",
    acceptedFormats: "PDF, ZIP, Images"
  },
  { 
    type: "other", 
    title: "Other", 
    icon: <FiGrid className="text-2xl" />,
    description: "Additional career-related documents",
    acceptedFormats: "All file types"
  },
];

// --- Custom Hook for Upload Logic ---
function useFileUpload() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });

  useEffect(() => { 
    fetchUploads(); 
  }, []);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const res = await userService.listPortfolioUploads();
      setUploads(Array.isArray(res) ? res : res.uploads || res.data || []);
    } catch (err) {
      setFeedback({ message: "Failed to load uploads. Please refresh the page.", type: "error" });
    }
    setLoading(false);
  };

  const uploadFile = async (file, type, setProgress) => {
    setFeedback({ message: "", type: "" });
    setLoading(true);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 30, 90));
    }, 200);

    try {
      await userService.uploadPortfolioFile(file, "", type);
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setFeedback({ message: `${file.name} uploaded successfully!`, type: "success" });
        fetchUploads();
        setProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      setFeedback({ message: "Upload failed. Please check your file and try again.", type: "error" });
    }
    setLoading(false);
  };

  const deleteFile = async (uploadId, filename) => {
    setFeedback({ message: "", type: "" });
    setLoading(true);
    try {
      await userService.deletePortfolioUpload(uploadId);
      setFeedback({ message: `${filename} deleted successfully.`, type: "success" });
      fetchUploads();
    } catch (err) {
      setFeedback({ message: "Delete failed. Please try again.", type: "error" });
    }
    setLoading(false);
  };

  return { uploads, loading, feedback, uploadFile, deleteFile };
}

// --- Enhanced UploadTabs ---
function UploadTabs({ currentTab, setCurrentTab }) {
  const currentType = UPLOAD_TYPES.find(t => t.type === currentTab);
  
  return (
    <div className="w-full mb-8">
      <StepperTabs
        steps={UPLOAD_TYPES.map((t) => t.title)}
        currentStep={UPLOAD_TYPES.findIndex((t) => t.type === currentTab) + 1}
        onStepChange={(idx) => setCurrentTab(UPLOAD_TYPES[idx - 1].type)}
      />
      
      {/* Current tab description */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          {currentType?.icon}
          <h3 className="font-semibold text-blue-900 dark:text-blue-50 text-lg">{currentType?.title}</h3>
        </div>
        <p className="text-blue-700 dark:text-blue-200 text-sm mb-2 font-medium">{currentType?.description}</p>
        <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">
          <span className="font-semibold">Accepted formats:</span> {currentType?.acceptedFormats}
        </p>
      </div>
    </div>
  );
}

// --- Enhanced FileUploadArea ---
function FileUploadArea({ onUpload, loading, currentType }) {
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0], setProgress);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0], setProgress);
    }
  };

  const getAcceptedTypes = () => {
    switch(currentType) {
      case 'resume':
      case 'cv':
        return '.pdf,.doc,.docx';
      case 'portfolio':
        return '.pdf,.zip,.jpg,.jpeg,.png';
      default:
        return '';
    }
  };

  return (
    <div className="w-full mb-8">
      <div
        className={`relative w-full flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed transition-all duration-300 ${
          dragActive 
            ? "border-green-400 bg-green-50 dark:bg-green-900/20 scale-105" 
            : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-900/10"
        }`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
        onDrop={handleDrop}
        tabIndex={0}
        aria-label="File upload area"
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept={getAcceptedTypes()}
          aria-label="Choose file to upload"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full transition-colors ${
            dragActive ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-gray-700"
          }`}>
            <FiUploadCloud className={`text-5xl transition-colors ${
              dragActive ? "text-green-500" : "text-gray-400 dark:text-gray-300"
            }`} />
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {dragActive ? "Drop your file here" : "Upload your file"}
            </h3>
            <p className="text-gray-600 dark:text-gray-200 mb-4 font-medium">
              Drag and drop your file here, or click to browse
            </p>
            
            <button
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? "Uploading..." : "Choose File"}
            </button>
            
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-3 font-medium">
              Max file size: 10MB • {UPLOAD_TYPES.find(t => t.type === currentType)?.acceptedFormats}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 min-w-[3rem]">
                {Math.round(progress)}%
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 text-center font-medium">Uploading your file...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Enhanced FileList & FileItem ---
function FileList({ files, onDelete, loading }) {
  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-700 dark:text-gray-200 font-medium">Loading files...</span>
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="text-center py-12">
        <FiFolder className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No files uploaded yet</h3>
        <p className="text-gray-600 dark:text-gray-200 font-medium">Upload your first file to get started with AI analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Uploaded Files ({files.length})
      </h3>
      <div className="space-y-2">
        {files.map((file) => (
          <FileItem key={file._id} file={file} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

function FileItem({ file, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const getFileIcon = (type) => {
    const iconClass = "text-2xl";
    switch (type) {
      case "resume":
        return <FiFileText className={`${iconClass} text-blue-500`} />;
      case "cv":
        return <FiBriefcase className={`${iconClass} text-purple-500`} />;
      case "portfolio":
        return <FiFolder className={`${iconClass} text-orange-500`} />;
      default:
        return <FiGrid className={`${iconClass} text-gray-500`} />;
    }
  };

  const getFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${file.filename}"?`)) {
      setIsDeleting(true);
      await onDelete(file._id, file.filename);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group">
      <div className="flex-shrink-0">
        {getFileIcon(file.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 dark:text-white truncate">{file.filename}</h4>
        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
          {file.size && <span>{getFileSize(file.size)}</span>}
          {file.uploadedAt && (
            <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
          )}
          <span className="capitalize bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200">
            {file.type}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {file.url && (
          <a
            href={file.url}
            download
            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Download file"
          >
            <FiDownload className="text-lg" />
          </a>
        )}
        
        <button
          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
          title="Delete file"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
          ) : (
            <FiTrash2 className="text-lg" />
          )}
        </button>
      </div>
    </div>
  );
}

// --- Enhanced Feedback Component ---
function FeedbackMessage({ feedback, onClose }) {
  if (!feedback.message) return null;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 transition-all duration-300 ${
      feedback.type === "success" 
        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-100" 
        : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-100"
    }`}>
      {feedback.type === "success" ? (
        <FiCheck className="text-xl flex-shrink-0" />
      ) : (
        <FiAlertCircle className="text-xl flex-shrink-0" />
      )}
      <span className="flex-1 font-bold">{feedback.message}</span>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
      >
        ×
      </button>
    </div>
  );
}

// --- Main Upload Page ---
function Upload() {
  const [currentTab, setCurrentTab] = useState("resume");
  const { uploads, loading, feedback, uploadFile, deleteFile } = useFileUpload();
  const files = uploads.filter((u) => u.type === currentTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full text-sm font-bold mb-4">
            📁 Document Management
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upload & Manage Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Career Documents</span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-200 max-w-2xl mx-auto font-medium">
            Securely upload your resume, CV, portfolio, and other career documents.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Tabs */}
          <UploadTabs currentTab={currentTab} setCurrentTab={setCurrentTab} />

          {/* Feedback */}
          <FeedbackMessage 
            feedback={feedback} 
            onClose={() => {}} 
          />

          {/* Upload Area */}
          <FileUploadArea 
            onUpload={(file, setProgress) => uploadFile(file, currentTab, setProgress)} 
            loading={loading}
            currentType={currentTab}
          />

          {/* File List */}
          <FileList 
            files={files} 
            onDelete={deleteFile} 
            loading={loading}
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[
         
          ].map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-200 font-medium">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Upload;
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { userService } from "../services/userService";
import { FiFileText, FiBriefcase, FiFolder, FiGrid, FiDownload, FiTrash2, FiUploadCloud, FiCheck, FiAlertCircle, FiInfo, FiX, FiChevronDown, FiChevronUp } from "react-icons/fi";
import StepperTabs from "../components/SkillGapAnalyzer/StepperTabs";
import DocumentFeedbackTrigger from "../components/AICareerCoach/DocumentFeedbackTrigger";
import Tour from "../components/Tour/Tour";


const UPLOAD_TYPES = [
  {
    type: "resume",
    title: "Resume",
    icon: <FiFileText className="text-2xl" />,
    description: "Upload your current resume for AI analysis",
    acceptedFormats: "PDF, DOC, DOCX"
  },
  {
    type: "cover-letter",
    title: "Cover Letter",
    icon: <FiBriefcase className="text-2xl" />,
    description: "Upload your cover letter templates and documents",
    acceptedFormats: "PDF, DOC, DOCX"
  },
  {
    type: "portfolio",
    title: "Portfolio",
    icon: <FiFolder className="text-2xl" />,
    description: "Showcase your work and projects",
    acceptedFormats: "PDF, ZIP, Images"
  },
];

// --- Custom Hook for Upload Logic ---
function useFileUpload() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", type: "" });
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const res = await userService.listPortfolioUploads();
      setUploads(Array.isArray(res) ? res : res.uploads || res.data || []);
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
      setFeedback({ message: "Failed to load uploads. Please refresh the page.", type: "error" });
      // Set empty array so page can still render
      setUploads([]);
    } finally {
      // Always set loading to false, even if there's an error
      setLoading(false);
    }
  };

  const uploadFile = async (file, type, setProgress) => {
    setFeedback({ message: "", type: "" });
    setLoading(true);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 30, 90));
    }, 200);

    try {
      // Single API call that handles both upload and analysis
      const result = await userService.uploadPortfolioFile(file, "", type);

      // Handle the analysis results if they're included in the response
      const data = result?.data || {};
      if (data.recommendations || data.textPreview) {
        setAnalysis({
          recommendations: data.recommendations || [],
          textPreview: data.textPreview || "",
          filename: file.name,
        });
      }

      clearInterval(progressInterval);
      setProgress(100);

      // Mark resume as uploaded if this is a resume upload
      if (type === 'resume') {
        const userId = localStorage.getItem('userId');
        if (userId) {
          localStorage.setItem(`resume-uploaded:${userId}`, 'true');
        }
      }

      setTimeout(() => {
        setFeedback({ message: `${file.name} uploaded and analyzed successfully!`, type: "success" });
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

      {/* Portfolio-specific instructions */}
      {currentTab === 'portfolio' && (
        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">📥</div>
            <div>
              <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-1">Portfolio Upload Instructions</h4>
              <p className="text-sm text-purple-700 dark:text-purple-200 mb-2">
                If you've built your portfolio using our Portfolio Builder, please <strong>download the exported version</strong> and upload it here for AI-powered analysis and feedback.
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-300">
                💡 <strong>Tip:</strong> Upload your portfolio as a PDF or ZIP file for best results. Our AI will analyze your work and provide improvement suggestions in the Document Feedback section.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter-specific instructions */}
      {currentTab === 'cover-letter' && (
        <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">📝</div>
            <div className="flex-1">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-100 mb-1">Dual-Path AI Analysis</h4>
              <p className="text-sm text-emerald-700 dark:text-emerald-200 mb-3">
                Our AI analyzes your cover letter using <strong>two powerful approaches</strong> to ensure comprehensive feedback:
              </p>
              <div className="space-y-2 mb-2">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <div className="text-xs text-emerald-700 dark:text-emerald-200">
                    <strong>Job-Specific Path</strong> (like resume analysis): Keyword optimization, ATS compatibility, job description alignment, and skills matching
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                  <div className="text-xs text-emerald-700 dark:text-emerald-200">
                    <strong>Presentation Path</strong> (like portfolio analysis): Storytelling quality, narrative flow, authenticity, personal branding, and impact communication
                  </div>
                </div>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-300 italic">
                💡 For best results, paste the target job description when prompted to receive tailored, job-specific feedback alongside presentation quality analysis.
              </p>
            </div>
          </div>
        </div>
      )}
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
    switch (currentType) {
      case 'resume':
      case 'cover-letter':
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
        className={`relative w-full flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed transition-all duration-300 upload-zone ${dragActive
          ? "border-green-400 bg-green-50 dark:bg-green-900/20 scale-105"
          : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-900/10"
          }`}
        data-tour="upload-zone"
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
          <div className={`p-4 rounded-full transition-colors ${dragActive ? "bg-green-100 dark:bg-green-900/30" : "bg-white dark:bg-gray-700"
            }`}>
            <FiUploadCloud className={`text-5xl transition-colors ${dragActive ? "text-green-500" : "text-gray-400 dark:text-gray-300"
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
    <div className="space-y-3 upload-history" data-tour="upload-history">
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
  const [expanded, setExpanded] = useState(false);

  // Color helpers for playful, Google-like pills
  const themePillClass = (idx) => {
    const palettes = [
      'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
      'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
      'bg-gradient-to-r from-emerald-400 to-teal-500 text-white',
      'bg-gradient-to-r from-sky-400 to-blue-500 text-white',
      'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white',
      'bg-gradient-to-r from-lime-400 to-green-500 text-white',
    ];
    return `text-xs px-2.5 py-1 rounded-full shadow-sm ${palettes[idx % palettes.length]}`;
  };

  const skillPillClass = (idx) => {
    const palettes = [
      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    ];
    return `text-xs px-2 py-0.5 rounded-full ${palettes[idx % palettes.length]}`;
  };

  const getFileIcon = (type) => {
    const iconClass = "text-2xl";
    switch (type) {
      case "resume":
        return <FiFileText className={`${iconClass} text-blue-500`} />;
      case "cover-letter":
        return <FiBriefcase className={`${iconClass} text-purple-500`} />;
      case "portfolio":
        return <FiFolder className={`${iconClass} text-orange-500`} />;
      default:
        return <FiFileText className={`${iconClass} text-gray-500`} />;
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
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 bg-white/90 dark:bg-gray-800/90">
      {/* Gradient accent bar */}
      <div className="h-1 w-full rounded-t-xl bg-gradient-to-r from-[#34a853] via-[#4285f4] to-[#ea4335]" />
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {getFileIcon(file.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-gray-900 dark:text-white truncate">{file.filename}</h4>
            {/* Status badge */}
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow ${file.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' :
              file.status === 'analyzing' ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white animate-pulse' :
                file.status === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white' :
                  'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
              }`}>{file.status || 'unknown'}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">
            {file.size && <span>{getFileSize(file.size)}</span>}
            {file.uploadedAt && (
              <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
            )}
            <span className="capitalize bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-200">
              {file.type}
            </span>
          </div>
          {/* Quick insights row */}
          {file.analysis?.extracted?.SUMMARY && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {/* Verification/analysis status */}
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-extrabold shadow-sm">
                {file.analysis.extracted.SUMMARY.analysis_status || 'completed'}
              </span>
              {/* Sentiment */}
              {typeof file.analysis.extracted.SUMMARY.sentiment === 'number' && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 text-white font-extrabold">
                  sentiment {file.analysis.extracted.SUMMARY.sentiment.toFixed(2)}
                </span>
              )}
              {/* Themes */}
              {(file.analysis.extracted.SUMMARY.key_themes || []).slice(0, 3).map((t, i) => (
                <span key={i} className={themePillClass(i)}>
                  {t}
                </span>
              ))}
              {/* Actions count */}
              {Array.isArray(file.analysis.extracted.SUMMARY.action_items) && file.analysis.extracted.SUMMARY.action_items.length > 0 && (
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold">
                  actions {file.analysis.extracted.SUMMARY.action_items.length}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Expand/collapse details */}
          {file.analysis?.extracted && (
            <button
              className="px-3 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
              onClick={() => setExpanded(!expanded)}
              title="Toggle details"
            >
              {expanded ? 'Hide details' : 'Show details'}
            </button>
          )}
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

      {/* Expanded details */}
      {expanded && file.analysis?.extracted && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">Action Items</div>
            <ul className="list-disc pl-5 text-xs text-gray-700 dark:text-gray-300 space-y-1">
              {(file.analysis.extracted.SUMMARY.action_items || []).slice(0, 6).map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">Skills Mentioned</div>
            <div className="flex flex-wrap gap-1">
              {(file.analysis.extracted.SKILLS_MENTIONED || []).slice(0, 10).map((s, i) => (
                <span key={i} className={skillPillClass(i)}>
                  {s.normalized_skill || s.skill}
                </span>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-gray-800 dark:to-gray-800">
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1">Verification</div>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              status: {file.analysis.extracted.SUMMARY.analysis_status || 'completed'}
            </div>
            {typeof file.analysis.extracted.SUMMARY.sentiment === 'number' && (
              <div className="text-xs text-gray-700 dark:text-gray-300">sentiment: {file.analysis.extracted.SUMMARY.sentiment.toFixed(2)}</div>
            )}
            {'content_vector' in (file.analysis || {}) && file.analysis.content_vector && (
              <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">vector: stored</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Resume Best Practices Notification ---
function ResumeBestPracticesNotification({ currentTab, onDismiss, isDismissed }) {
  // Only show for resume and cover letter tabs
  if (currentTab !== "resume" && currentTab !== "cover-letter") return null;
  if (isDismissed) return null;

  const [expanded, setExpanded] = useState(false);

  const bestPractices = [
    {
      icon: "✅",
      title: "Clear Structure",
      description: "Organize your resume with clear sections: Contact Info, Summary/Objective, Experience, Education, Skills, Certifications"
    },
    {
      icon: "🎯",
      title: "Complete Skills List",
      description: "Include ALL your technical skills, tools, software, equipment, and methodologies. The AI will extract them automatically."
    },
    {
      icon: "📜",
      title: "Certifications & Qualifications",
      description: "List all certifications, licenses, and professional qualifications separately for better recognition."
    },
    {
      icon: "💼",
      title: "Experience Details",
      description: "Provide complete job descriptions with achievements, responsibilities, and technologies used."
    },
    {
      icon: "🎓",
      title: "Education & Training",
      description: "Include degrees, institutions, dates, and any relevant coursework or training programs."
    },
    {
      icon: "📄",
      title: "Readable Format",
      description: "Use clear fonts and formatting. Avoid complex layouts or images that might confuse text extraction."
    }
  ];

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-1">
          <FiInfo className="text-2xl text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 text-lg mb-1">
            💡 Resume Best Practices
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-200 mb-2">
            Structure your resume properly to get the most accurate AI analysis. Our system will extract all your skills, experience, and qualifications automatically.
          </p>

          {/* Expandable tips */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 transition-colors mt-2"
          >
            {expanded ? (
              <>
                <span>Hide Tips</span>
                <FiChevronUp />
              </>
            ) : (
              <>
                <span>Show Best Practices Tips</span>
                <FiChevronDown />
              </>
            )}
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 hover:bg-blue-200/50 dark:hover:bg-blue-800/50 rounded transition-colors"
          title="Dismiss notification"
        >
          <FiX className="text-lg text-blue-600 dark:text-blue-400" />
        </button>
      </div>

      {/* Expanded tips */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-blue-200 dark:border-blue-800 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bestPractices.map((practice, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <span className="text-2xl flex-shrink-0">{practice.icon}</span>
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1">
                    {practice.title}
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-200">
                    {practice.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Enhanced Feedback Component ---
function FeedbackMessage({ feedback, onClose }) {
  if (!feedback.message) return null;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 transition-all duration-300 ${feedback.type === "success"
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fromOnboarding = searchParams.get('from') === 'onboarding';
  const returnTo = searchParams.get('returnTo') || '/ai-career-coach';
  const initialType = searchParams.get('type') || 'resume';

  const [currentTab, setCurrentTab] = useState(initialType);
  const { uploads, loading, feedback, uploadFile, deleteFile } = useFileUpload();
  const [analysis, setAnalysis] = useState(null);
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  const files = uploads.filter((u) => u.type === currentTab);

  // Reset notification when switching to resume/cover-letter tab
  useEffect(() => {
    if (currentTab === "resume" || currentTab === "cover-letter") {
      // Keep dismissal state, but you can reset it if needed
      // setNotificationDismissed(false);
    }
  }, [currentTab]);

  // Handle successful upload when coming from onboarding
  const hasRedirectedRef = useRef(false);
  useEffect(() => {
    // Only redirect if:
    // 1. We're coming from onboarding
    // 2. There are files uploaded
    // 3. Not currently loading
    // 4. Haven't already redirected
    if (fromOnboarding && files.length > 0 && !loading && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      // Auto-return to onboarding after successful upload
      const timer = setTimeout(() => {
        navigate(returnTo, { replace: true });
      }, 2000); // Increased to 2 seconds to show success message
      return () => clearTimeout(timer);
    }
  }, [fromOnboarding, files.length, loading, navigate, returnTo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {fromOnboarding && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-200 font-medium">
                📝 Onboarding: Upload your resume to continue
              </p>
            </div>
          )}
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full text-sm font-bold mb-4">
            📁 Document Management
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upload & Manage Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Career Documents</span>
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-200 max-w-2xl mx-auto font-medium">
            Securely upload your resume, cover letter, and portfolio documents.
          </p>
          {fromOnboarding && (
            <div className="mt-4">
              <button
                onClick={() => navigate(returnTo)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Back to onboarding
              </button>
            </div>
          )}
        </div>

        {/* Main Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {/* Tabs */}
          <div>
            <UploadTabs currentTab={currentTab} setCurrentTab={setCurrentTab} />
          </div>


          {/* Resume Best Practices Notification */}
          <ResumeBestPracticesNotification
            currentTab={currentTab}
            onDismiss={() => setNotificationDismissed(true)}
            isDismissed={notificationDismissed}
          />

          {/* Document Feedback Trigger - For existing uploads */}
          <div className="document-feedback">
            {files.length > 0 && <DocumentFeedbackTrigger />}
          </div>


          {/* Feedback */}
          <FeedbackMessage
            feedback={feedback}
            onClose={() => { }}
          />

          {/* Upload Area */}
          <FileUploadArea
            onUpload={async (file, setProgress) => {
              await uploadFile(file, currentTab, setProgress);
              // Pull analysis from hook's state by reloading page slice is complex; show a toast instructing user to see panel below
            }}
            loading={loading}
            currentType={currentTab}
          />

          {/* Analysis Panel */}
          {analysis && (
            <div className="mt-6 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10">
              <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">AI Recommendations</h3>
              {analysis.error ? (
                <p className="text-red-600 dark:text-red-400 text-sm">{analysis.error}</p>
              ) : (
                <div className="space-y-3">
                  {(analysis.recommendations || []).map((rec, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{rec.title || `Recommendation ${idx + 1}`}</div>
                      {rec.rationale && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{rec.rationale}</div>
                      )}
                      {Array.isArray(rec.actions) && rec.actions.length > 0 && (
                        <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 dark:text-gray-200">
                          {rec.actions.map((a, i) => (<li key={i}>{a}</li>))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File List */}
          <div>
            <FileList
              files={files}
              onDelete={deleteFile}
              loading={loading}
            />
          </div>


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

      {/* Tour Component */}
      <Tour tourId="upload" />
    </div>
  );
}

export default Upload;
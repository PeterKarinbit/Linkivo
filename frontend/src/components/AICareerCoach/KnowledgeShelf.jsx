import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchKnowledgeShelf, deleteKnowledgeBaseItem } from '../../services/knowledgeShelfService.js';
import { FiX, FiBookOpen, FiSearch, FiCheckCircle, FiAlertCircle, FiTrash2, FiExternalLink } from 'react-icons/fi';
import './KnowledgeShelf.css';

// DARKER COLOR PALETTE - Inspired by the Framer reference
const SECTION_CONFIG = {
  processed: {
    title: 'Processed Insights',
    shortTitle: 'Insights',
    description: 'Journal reflections, document analysis, and AI-powered insights',
    color: '#7a2828', // Dark rich red
    glow: 'rgba(122, 40, 40, 0.4)',
    icon: FiBookOpen
  },
  research: {
    title: 'Research Deck',
    shortTitle: 'Research',
    description: 'Market insights, curated resources, and career intelligence',
    color: '#1e3a32', // Dark forest green
    glow: 'rgba(30, 58, 50, 0.4)',
    icon: FiSearch
  },
  progress: {
    title: 'Progress Trail',
    shortTitle: 'Progress',
    description: 'Your milestones, achievements, and career checkpoints',
    color: '#1a1a2e', // Deep navy/black
    glow: 'rgba(26, 26, 46, 0.4)',
    icon: FiCheckCircle
  },
  signals: {
    title: 'Document Feedback',
    shortTitle: 'Feedback',
    description: 'AI-powered suggestions to improve your resume and portfolio',
    color: '#2d2540', // Dark purple
    glow: 'rgba(45, 37, 64, 0.4)',
    icon: FiAlertCircle
  }
};

const BOOK_ORDER = ['processed', 'research', 'progress', 'signals'];

// Premium Tall Thin Book Component
const Book3D = ({ id, config, isExpanded, data, onClick, dataTour }) => {
  const itemCount = data?.entries?.length || 0;

  return (
    <div
      className={`book-3d-container ${isExpanded ? 'expanded' : ''}`}
      onClick={onClick}
      data-tour={dataTour}
      style={{
        '--book-color': config.color,
        '--book-glow': config.glow,
      }}
    >
      {/* Item count badge */}
      {itemCount > 0 && !isExpanded && (
        <div className="book-item-count">{itemCount}</div>
      )}

      <div className="book-3d">
        {/* Spine - visible when closed */}
        <div className="book-3d-spine">
          <h4>{config.shortTitle}</h4>
        </div>

        {/* Cover - visible when expanded */}
        <div className="book-3d-cover">
          <span className="cover-label">Knowledge Base</span>
          <h3 className="cover-title">{config.title}</h3>
          <p className="cover-subtitle">{config.description}</p>
          <div className="cover-stats">
            <div className="cover-stat-item">
              <span className="stat-dot"></span>
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
          </div>
        </div>

        {/* Pages (right side) */}
        <div className="book-3d-pages"></div>

        {/* Top edge */}
        <div className="book-3d-top"></div>

        {/* Bottom edge */}
        <div className="book-3d-bottom"></div>
      </div>
    </div>
  );
};

// Skeleton loading book
const SkeletonBook = () => (
  <div className="book-3d-container book-skeleton">
    <div className="book-3d">
      <div className="book-3d-spine" style={{ background: 'linear-gradient(180deg, #2a2a35, #1a1a22)' }}>
        <h4></h4>
      </div>
      <div className="book-3d-pages"></div>
      <div className="book-3d-top"></div>
      <div className="book-3d-bottom"></div>
    </div>
  </div>
);

// Content Renderer
const ContentRenderer = ({ content, entry }) => {
  if (!content) return <p className="text-gray-400 italic text-sm">No content available</p>;

  // Handle chart items
  if (entry?.type === 'chart') {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center text-lg">📊</div>
          <div>
            <h4 className="font-semibold text-white text-sm">{entry.title}</h4>
            <p className="text-xs text-gray-400">{entry.summary}</p>
          </div>
        </div>
      </div>
    );
  }

  // Parse string content
  let parsedContent = content;
  if (typeof content === 'string' && (content.trim().startsWith('{') || content.trim().startsWith('['))) {
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      parsedContent = content;
    }
  }

  // String content
  if (typeof parsedContent === 'string') {
    return <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed">{parsedContent}</div>;
  }

  const data = parsedContent;

  // Structured Document Analysis
  if (data.summary && data.skills) {
    return (
      <div className="space-y-4">
        {data.summary.key_themes && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Key Themes</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.summary.key_themes.map((theme, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs font-medium">{theme}</span>
              ))}
            </div>
          </div>
        )}
        {data.skills && data.skills.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.slice(0, 10).map((skill, idx) => {
                // Handle both string and object skill formats
                const skillName = typeof skill === 'string' 
                  ? skill 
                  : (skill?.name || skill?.skill || skill?.keyword || JSON.stringify(skill));
                return (
                  <span key={idx} className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">{skillName}</span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Journal Insights
  if (data.sentiment || data.topics) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {data.sentiment && (
            <div className="px-2.5 py-1 rounded-full bg-purple-900/30 text-purple-300 text-xs font-medium">
              Sentiment: {Math.round(data.sentiment * 100)}%
            </div>
          )}
          {data.topics && data.topics.slice(0, 4).map((t, i) => (
            <span key={i} className="px-2 py-1 bg-gray-700/50 text-gray-400 rounded text-xs">#{t}</span>
          ))}
        </div>
        {data.summary && <div className="text-gray-300 text-sm leading-relaxed line-clamp-3">{data.summary}</div>}
      </div>
    );
  }

  // Progress Trail - Milestones with full info
  if (data.stats || entry?.status || entry?.priority || entry?.due_date) {
    const isCompleted = entry?.status === 'completed';
    const priorityColors = {
      high: 'bg-red-900/30 text-red-300 border-red-700',
      medium: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
      low: 'bg-blue-900/30 text-blue-300 border-blue-700'
    };
    const statusColors = {
      completed: 'bg-emerald-900/30 text-emerald-300 border-emerald-700',
      in_progress: 'bg-blue-900/30 text-blue-300 border-blue-700',
      blocked: 'bg-red-900/30 text-red-300 border-red-700',
      upcoming: 'bg-gray-700/50 text-gray-400 border-gray-600'
    };

    return (
      <div className="space-y-3">
        {entry?.description && (
          <p className="text-gray-300 text-sm leading-relaxed">{entry.description}</p>
        )}
        {entry?.outcome && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Expected Outcome</h4>
            <p className="text-gray-300 text-sm">{entry.outcome}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[entry?.status] || statusColors.upcoming}`}>
            {entry?.status || 'upcoming'}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium border ${priorityColors[entry?.priority] || priorityColors.medium}`}>
            {entry?.priority || 'medium'} priority
          </span>
          {entry?.due_date && (
            <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
              Due: {new Date(entry.due_date).toLocaleDateString()}
            </span>
          )}
          {entry?.estimated_hours > 0 && (
            <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs">
              ~{entry.estimated_hours}h
            </span>
          )}
        </div>
        {entry?.skills && entry.skills.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1.5">
              {entry.skills.slice(0, 8).map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-xs">{skill}</span>
              ))}
            </div>
          </div>
        )}
        {entry?.resources && entry.resources.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Resources</h4>
            <div className="space-y-1">
              {entry.resources.slice(0, 3).map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-blue-400 hover:text-blue-300 hover:underline"
                >
                  {resource.title} {resource.estimated_hours ? `(~${resource.estimated_hours}h)` : ''}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Document Feedback - Structured recommendations
  if (data.recommendations || entry?.recommendations || entry?.matchScore !== undefined) {
    const recommendations = entry?.recommendations || data.recommendations || [];
    const overallAssessment = entry?.overallAssessment || data.overall_assessment;
    const matchScore = entry?.matchScore || overallAssessment?.keyword_match_score || overallAssessment?.ats_compatibility_score;
    
    const categoryColors = {
      keyword_gap: 'bg-orange-900/30 text-orange-300 border-orange-700',
      content_enhancement: 'bg-blue-900/30 text-blue-300 border-blue-700',
      formatting: 'bg-purple-900/30 text-purple-300 border-purple-700',
      career_gap: 'bg-red-900/30 text-red-300 border-red-700'
    };
    const priorityColors = {
      high: 'bg-red-900/30 text-red-300',
      medium: 'bg-yellow-900/30 text-yellow-300',
      low: 'bg-green-900/30 text-green-300'
    };
    const statusColors = {
      new: 'bg-blue-900/30 text-blue-300',
      reviewed: 'bg-yellow-900/30 text-yellow-300',
      addressed: 'bg-emerald-900/30 text-emerald-300',
      dismissed: 'bg-gray-700/50 text-gray-400'
    };

    return (
      <div className="space-y-4">
        {/* Overall Assessment & Match Score */}
        {overallAssessment && (
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Overall Assessment</h4>
              {matchScore !== null && (
                <div className={`px-2 py-1 rounded text-xs font-bold ${
                  matchScore >= 80 ? 'bg-emerald-900/30 text-emerald-300' :
                  matchScore >= 60 ? 'bg-yellow-900/30 text-yellow-300' :
                  'bg-red-900/30 text-red-300'
                }`}>
                  {matchScore}% Match
                </div>
              )}
            </div>
            <p className="text-gray-300 text-sm">{overallAssessment.summary || 'No summary available'}</p>
            {overallAssessment.ats_compatibility_score !== undefined && (
              <div className="mt-2 text-xs text-gray-400">
                ATS Compatibility: {overallAssessment.ats_compatibility_score}%
              </div>
            )}
          </div>
        )}

        {/* Recommendations by Category */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Recommendations ({recommendations.length})
            </h4>
            {recommendations.slice(0, 5).map((rec, idx) => (
              <div key={idx} className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h5 className="font-semibold text-white text-sm mb-1">{rec.title}</h5>
                    <p className="text-gray-400 text-xs leading-relaxed">{rec.rationale}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${categoryColors[rec.category] || categoryColors.content_enhancement}`}>
                      {rec.category?.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[rec.priority] || priorityColors.medium}`}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
                {rec.missing_keywords && rec.missing_keywords.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Missing: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rec.missing_keywords.slice(0, 5).map((keyword, kIdx) => (
                        <span key={kIdx} className="px-1.5 py-0.5 bg-orange-900/20 text-orange-300 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {rec.suggested_improvements && rec.suggested_improvements.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Suggestions: </span>
                    <ul className="list-disc list-inside text-xs text-gray-300 mt-1 space-y-0.5">
                      {rec.suggested_improvements.slice(0, 3).map((improvement, iIdx) => (
                        <li key={iIdx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {rec.actions && rec.actions.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">Actions: </span>
                    <ul className="list-disc list-inside text-xs text-gray-300 mt-1 space-y-0.5">
                      {rec.actions.slice(0, 2).map((action, aIdx) => (
                        <li key={aIdx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            {recommendations.length > 5 && (
              <p className="text-xs text-gray-500 text-center">
                +{recommendations.length - 5} more recommendations
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <pre className="bg-gray-800/50 p-3 rounded-lg overflow-x-auto text-xs font-mono text-gray-400">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

// Expanded Content Panel - Clean UI with Light/Dark Support
const ExpandedContent = ({ section, data, onClose, onDelete }) => {
  const config = SECTION_CONFIG[section];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl"
    >
      {/* Header */}
      <div
        className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800"
        style={{ background: `linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%)` }}
      >
        <div className="flex items-center gap-4 text-white">
          <motion.button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiX className="text-xl" />
          </motion.button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
              <Icon className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{config.title}</h2>
              <p className="text-xs opacity-90">
                {data?.entries?.length || 0} items
                {section === 'progress' && data?.stats && (
                  <span className="ml-2">• {data.stats.progressPercentage}% Complete</span>
                )}
                {section === 'signals' && data?.stats && (
                  <span className="ml-2">• {data.stats.byPriority.high} High Priority</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto bg-gray-50 dark:bg-slate-900/50 p-6 max-h-[450px]">
        {(!data?.entries || data.entries.length === 0) ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
              <Icon className="text-2xl opacity-40 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Entries Yet</h3>
            <p className="text-center max-w-sm text-sm text-gray-500">
              {section === 'processed' ? 'Journal reflections and document analysis will appear here.' :
                section === 'research' ? 'Market research and resources will show up as you explore.' :
                  section === 'progress' ? 'Your milestones and achievements will be tracked here.' :
                    'AI feedback and suggestions will appear here.'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {data.entries.map((entry, idx) => (
              <motion.div
                key={entry.id || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1.5 truncate">{entry.title || 'Untitled Entry'}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {new Date(entry.updatedAt || entry.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      {(entry.tags || []).slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded border border-blue-100 dark:border-blue-900/50">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {onDelete && entry.id && /^[0-9a-fA-F]{24}$/.test(entry.id) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this item?')) onDelete(entry.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  )}
                </div>
                <div className="text-sm">
                  <ContentRenderer content={entry.content || entry.summary} entry={entry} />
                  
                  {/* Progress Trail: Mark as Complete button */}
                  {section === 'progress' && entry.status !== 'completed' && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const response = await fetch(`/api/v1/enhanced-ai-career-coach/milestones/${entry.id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'completed' })
                          });
                          if (response.ok) {
                            window.location.reload(); // Refresh to show updated status
                          }
                        } catch (err) {
                          console.error('Failed to update milestone:', err);
                          alert('Failed to mark milestone as complete');
                        }
                      }}
                      className="mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Mark as Complete
                    </button>
                  )}
                  
                  {/* Document Feedback: Status selector and document link */}
                  {section === 'signals' && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <select
                        value={entry.status || 'new'}
                        onChange={async (e) => {
                          try {
                            const response = await fetch(`/api/v1/enhanced-ai-career-coach/feedback/${entry.id}/status`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: e.target.value })
                            });
                            if (response.ok) {
                              window.location.reload();
                            }
                          } catch (err) {
                            console.error('Failed to update feedback status:', err);
                          }
                        }}
                        className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded border border-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="addressed">Addressed</option>
                        <option value="dismissed">Dismissed</option>
                      </select>
                      {entry.documentId && (
                        <button
                          type="button"
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              // Get auth token
                              const token = localStorage.getItem('accessToken') || '';
                              if (!token) {
                                alert('Please log in to download documents');
                                return;
                              }
                              
                              // Fetch file with authentication
                              const response = await fetch(`/api/v1/user/uploads/${entry.documentId}`, {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              
                              if (!response.ok) {
                                const error = await response.json().catch(() => ({ message: 'Download failed' }));
                                throw new Error(error.message || 'Download failed');
                              }
                              
                              // Get filename from response headers or use documentId
                              const contentDisposition = response.headers.get('Content-Disposition');
                              let filename = entry.documentId;
                              if (contentDisposition) {
                                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
                                if (filenameMatch) filename = filenameMatch[1];
                              }
                              
                              // Create blob and download
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = filename;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } catch (err) {
                              console.error('Download error:', err);
                              alert(err.message || 'Failed to download document. Please try again.');
                            }
                          }}
                        >
                          <FiExternalLink className="w-3 h-3" />
                          Download Document
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Show clickable link for Research Deck items */}
                  {section === 'research' && entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      <FiExternalLink className="w-3 h-3" />
                      <span>Read full article</span>
                      {entry.source && <span className="text-gray-500">• {entry.source}</span>}
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const KnowledgeShelf = () => {
  const [shelfData, setShelfData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBook, setExpandedBook] = useState(null);

  useEffect(() => {
    const loadShelf = async () => {
      setIsLoading(true);
      try {
        const data = await fetchKnowledgeShelf();
        setShelfData(data.sections || {});
      } catch (err) {
        console.error('Failed to load shelf data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadShelf();
  }, []);

  const handleBookClick = (key) => {
    setExpandedBook(expandedBook === key ? null : key);
  };

  const handleDelete = async (itemId) => {
    try {
      await deleteKnowledgeBaseItem(itemId);
      const data = await fetchKnowledgeShelf({ force: true });
      setShelfData(data.sections || {});
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item.');
    }
  };

  return (
    <div className="w-full py-8 knowledge-shelf-container">
      <div className="max-w-5xl mx-auto px-4">
        {/* Dark Background Container */}
        <div className="bookshelf-bg">
          {/* Section Title */}
          <div className="shelf-title">
            <h2>Knowledge Base</h2>
          </div>

          {/* Books Container */}
          <motion.div
            className="flex items-end justify-center gap-4 md:gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {isLoading ? (
              <>
                <SkeletonBook />
                <SkeletonBook />
                <SkeletonBook />
                <SkeletonBook />
              </>
            ) : (
              BOOK_ORDER.map((key, index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1, type: 'spring', stiffness: 100 }}
                >
                  <Book3D
                    id={key}
                    config={SECTION_CONFIG[key]}
                    isExpanded={expandedBook === key}
                    data={shelfData?.[key]}
                    onClick={() => handleBookClick(key)}
                    dataTour={key === 'research' ? 'research-deck' : null}
                  />
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-gray-800/50 rounded-full">
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-400">Loading...</span>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Content - Below the shelf */}
        <AnimatePresence>
          {expandedBook && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ExpandedContent
                section={expandedBook}
                data={shelfData?.[expandedBook]}
                onClose={() => setExpandedBook(null)}
                onDelete={handleDelete}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KnowledgeShelf;

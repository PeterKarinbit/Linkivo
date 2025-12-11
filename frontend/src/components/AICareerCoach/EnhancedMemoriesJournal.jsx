import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Plus, Search, Calendar, Sparkles, TrendingUp, Award, BookOpen, ChevronDown, ChevronUp, Trash2, MoreVertical, Loader2, Menu, ChevronLeft, ChevronRight, Mic, Camera, Paperclip, Share2, User, Bold, Italic, List, Quote, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Save, Edit2, Rocket, Smile, Heart, Target, Zap, ThumbsUp, Meh, Trophy, GraduationCap, Users, Brain, Briefcase, MessageSquare, ExternalLink, Book } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths } from 'date-fns';
import api from '../../services/apiBase';
import { useNavigate } from 'react-router-dom';

// Find the main container in EnhancedMemoriesJournal and add data-tour

const UpgradeModal = ({ isOpen, onClose, message, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Upgrade Required</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">{message}</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            Maybe Later
          </button>
          <button
            onClick={onUpgrade}
            className="flex-1 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all shadow-lg hover:shadow-xl"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

// Rich Text Editor Component
const RichTextEditor = ({ content, onChange, isEditing }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && isEditing && !initialized) {
      editorRef.current.innerHTML = content || '<p></p>';
      setInitialized(true);
    }
  }, [content, isEditing, initialized]);

  const handleInput = (e) => {
    if (onChange) {
      onChange(e.target.innerHTML);
    }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const ToolbarButton = ({ icon: Icon, command, value, title }) => (
    <button
      type="button"
      onClick={() => executeCommand(command, value)}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
      title={title}
    >
      <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    </button>
  );

  if (!isEditing) {
    return (
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-500 italic">No content</p>' }}
      />
    );
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <ToolbarButton icon={Bold} command="bold" title="Bold (Ctrl+B)" />
        <ToolbarButton icon={Italic} command="italic" title="Italic (Ctrl+I)" />
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Align Left" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Align Center" />
        <ToolbarButton icon={AlignRight} command="justifyRight" title="Align Right" />
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
        <ToolbarButton icon={Quote} command="formatBlock" value="blockquote" title="Quote" />
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        <ToolbarButton icon={Undo} command="undo" title="Undo (Ctrl+Z)" />
        <ToolbarButton icon={Redo} command="redo" title="Redo (Ctrl+Y)" />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[300px] p-4 focus:outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-900 ${isFocused ? 'ring-2 ring-blue-500' : ''
          }`}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};


// Calendar Component
const CalendarWidget = ({ selectedDate, onDateSelect, entries, isCollapsed, onToggle }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = getDay(monthStart);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const hasEntryOnDate = (date) => {
    return entries.some(entry => {
      const entryDate = entry.date || entry.entry_date || entry.createdAt || entry.updatedAt;
      if (!entryDate) return false;
      try {
        return isSameDay(new Date(entryDate), date);
      } catch {
        return false;
      }
    });
  };

  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm font-semibold text-[#1F2A2E]">Calendar</span>
        <ChevronDown className="w-4 h-4 text-[#1F2A2E]" />
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronUp className="w-4 h-4 text-[#1F2A2E]" />
        </button>
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronLeft className="w-4 h-4 text-[#1F2A2E]" />
        </button>
        <h3 className="text-sm font-semibold text-[#1F2A2E]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronRight className="w-4 h-4 text-[#1F2A2E]" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, idx) => (
          <div key={idx} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
          <div key={`empty-${idx}`} className="aspect-square" />
        ))}
        {daysInMonth.map((day, idx) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasEntry = hasEntryOnDate(day);
          return (
            <button
              key={idx}
              onClick={() => onDateSelect(day)}
              className={`aspect-square text-xs rounded flex items-center justify-center transition-colors ${isSelected
                ? 'bg-blue-600 text-white font-semibold'
                : hasEntry
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

function EnhancedMemoriesJournal() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(null);
  const [selectedMood, setSelectedMood] = useState('all');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [selectedMoodForEntry, setSelectedMoodForEntry] = useState('neutral');
  const [selectedCategory, setSelectedCategory] = useState('reflection');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [expandedEntries, setExpandedEntries] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isEditingEntry, setIsEditingEntry] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState(false);
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Toggle entry expansion
  const toggleExpandEntry = (id) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Fetch journal entries on component mount (using axios base /api/v1)
  useEffect(() => {
    const fetchJournalEntries = async () => {
      setIsLoadingMemories(true);
      try {
        const response = await api.get('/enhanced-ai-career-coach/journal');
        const items = response.data?.data?.items || response.data?.data || [];
        setJournalEntries(items);
      } catch (error) {
        console.error('Failed to fetch journal entries:', error);
        // Fallback to localStorage if API fails
        const localEntries = JSON.parse(localStorage.getItem('careerJournalEntries') || '[]');
        setJournalEntries(localEntries);
      } finally {
        setIsLoadingMemories(false);
      }
    };

    fetchJournalEntries();
  }, []);

  // Delete an entry
  const handleDeleteEntry = async (entryId) => {
    if (!entryId) {
      console.error('Cannot delete entry: No ID provided');
      return;
    }

    try {
      // If it's a local entry (starts with 'local_')
      if (entryId.startsWith('local_')) {
        setJournalEntries(prev => {
          const updatedEntries = prev.filter(entry => (entry._id || entry.id) !== entryId);
          // Update localStorage
          if (updatedEntries.length > 0) {
            localStorage.setItem('careerJournalEntries', JSON.stringify(updatedEntries));
          } else {
            localStorage.removeItem('careerJournalEntries');
          }
          return updatedEntries;
        });
        // Clear selected entry if it was the deleted one
        if (selectedEntry && (selectedEntry._id || selectedEntry.id) === entryId) {
          setSelectedEntry(null);
        }
      } else {
        // Delete from backend
        await api.delete(`/enhanced-ai-career-coach/journal/${entryId}`);
        // Update local state
        setJournalEntries(prev => prev.filter(entry => (entry._id || entry.id) !== entryId));
        // Clear selected entry if it was the deleted one
        if (selectedEntry && (selectedEntry._id || selectedEntry.id) === entryId) {
          setSelectedEntry(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    } finally {
      setShowDeleteConfirm(null);
    }
  };
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const navigate = useNavigate();

  const moods = [
    { value: 'all', label: 'All Moods', icon: Sparkles, color: 'from-gray-500 to-gray-600' },
    { value: 'excited', label: 'Excited', icon: Rocket, color: 'from-green-500 to-emerald-600' },
    { value: 'confident', label: 'Confident', icon: ThumbsUp, color: 'from-blue-500 to-blue-600' },
    { value: 'grateful', label: 'Grateful', icon: Heart, color: 'from-purple-500 to-purple-600' },
    { value: 'focused', label: 'Focused', icon: Target, color: 'from-yellow-500 to-orange-500' },
    { value: 'challenged', label: 'Challenged', icon: Zap, color: 'from-orange-500 to-red-500' },
    { value: 'reflective', label: 'Reflective', icon: Brain, color: 'from-indigo-500 to-indigo-600' },
    { value: 'neutral', label: 'Neutral', icon: Meh, color: 'from-gray-400 to-gray-500' }
  ];

  // Career-specific categories with Knowledge Base mappings
  const categories = [
    {
      value: 'skill-development',
      label: 'Skill Development',
      icon: GraduationCap,
      color: 'bg-blue-100 dark:bg-blue-900',
      description: 'Learning new skills, certifications, courses',
      knowledgeSection: 'processed'
    },
    {
      value: 'career-milestone',
      label: 'Career Milestone',
      icon: Trophy,
      color: 'bg-yellow-100 dark:bg-yellow-900',
      description: 'Promotions, job changes, achievements',
      knowledgeSection: 'processed'
    },
    {
      value: 'networking',
      label: 'Networking',
      icon: Users,
      color: 'bg-green-100 dark:bg-green-900',
      description: 'Connections, mentorship, professional relationships',
      knowledgeSection: 'research'
    },
    {
      value: 'challenge-overcome',
      label: 'Challenge Overcome',
      icon: Zap,
      color: 'bg-red-100 dark:bg-red-900',
      description: 'Obstacles faced and solutions found',
      knowledgeSection: 'signals'
    },
    {
      value: 'ai-impact',
      label: 'AI Impact',
      icon: Sparkles,
      color: 'bg-pink-100 dark:bg-pink-900',
      description: 'How AI is affecting your role/industry',
      knowledgeSection: 'research'
    },
    {
      value: 'reflection',
      label: 'Reflection',
      icon: Brain,
      color: 'bg-cyan-100 dark:bg-cyan-900',
      description: 'Personal insights, lessons learned',
      knowledgeSection: 'processed'
    },
    {
      value: 'job-search',
      label: 'Job Search',
      icon: Briefcase,
      color: 'bg-orange-100 dark:bg-orange-900',
      description: 'Applications, interviews, market research',
      knowledgeSection: 'progress'
    },
    {
      value: 'feedback-received',
      label: 'Feedback',
      icon: MessageSquare,
      color: 'bg-teal-100 dark:bg-teal-900',
      description: 'Performance reviews, peer feedback',
      knowledgeSection: 'progress'
    }
  ];

  // Load journal entries from API (axios base already includes /api/v1)
  const fetchJournalEntries = useCallback(async () => {
    setIsLoadingMemories(true);
    try {
      const response = await api.get('/enhanced-ai-career-coach/journal');
      const items = response.data?.data?.items || response.data?.data || [];
      setJournalEntries(items);
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      // Fallback to localStorage if API fails
      const stored = localStorage.getItem('careerJournalEntries');
      if (stored) {
        try {
          setJournalEntries(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored entries:', e);
        }
      }
    } finally {
      setIsLoadingMemories(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchJournalEntries();
  }, [fetchJournalEntries]);

  // Handle file upload
  const handleFileUpload = (type) => {
    if (type === 'file') {
      fileInputRef.current?.click();
    } else if (type === 'image') {
      imageInputRef.current?.click();
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, you'd upload to a server
    // For now, we'll just show a notification
    alert(`${type === 'image' ? 'Image' : 'File'} selected: ${file.name}`);
    // You can add actual upload logic here
  };

  // Handle voice recording
  const handleVoiceRecord = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Voice recording is not supported in your browser');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // In a real app, you'd use a library like RecordRTC
        alert('Voice recording started. This is a placeholder - implement actual recording logic.');
        // Stop recording after some time or user action
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        alert('Could not access microphone. Please check permissions.');
      });
  };

  // Handle share
  const handleShare = async () => {
    if (!selectedEntry) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedEntry.title || 'Career Memory',
          text: selectedEntry.content?.replace(/<[^>]*>/g, '') || '',
          url: window.location.href
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      const textToShare = `${selectedEntry.title || 'Career Memory'}\n\n${selectedEntry.content?.replace(/<[^>]*>/g, '') || ''}`;
      navigator.clipboard.writeText(textToShare).then(() => {
        alert('Content copied to clipboard!');
      });
    }
  };

  // Handle edit entry
  const handleEditEntry = () => {
    if (!selectedEntry) return;
    setIsEditingEntry(true);
    setEditedContent(selectedEntry.content || '');
    setEditedTitle(selectedEntry.title || '');
  };

  // Handle save edited entry
  const handleSaveEdit = async () => {
    if (!selectedEntry) return;

    // Helper function to clean and capitalize title
    const cleanTitle = (title) => {
      if (!title) return '';
      // Strip HTML tags
      const plain = title.replace(/<[^>]*>/g, '').trim();
      if (!plain) return '';
      // Capitalize first letter of each word
      return plain
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    // Calculate cleanedTitle outside try block so it's available in catch block
    const entryId = selectedEntry._id || selectedEntry.id || selectedEntry.entry_id;
      const cleanedTitle = cleanTitle(editedTitle);

    if (!entryId) {
      console.error('Cannot update entry: No ID found', selectedEntry);
      alert('Error: Cannot update entry. Please refresh the page and try again.');
      return;
    }

    try {
      console.log(`[UPDATE] Updating entry with ID: ${entryId}`);
      const response = await api.put(`/enhanced-ai-career-coach/journal/${entryId}`, {
        title: cleanedTitle,
        content: editedContent
      });

      // Update local state
      setJournalEntries(prev => prev.map(entry =>
        (entry._id || entry.id) === entryId
          ? { ...entry, title: cleanedTitle, content: editedContent }
          : entry
      ));

      setSelectedEntry({ ...selectedEntry, title: cleanedTitle, content: editedContent });
      setIsEditingEntry(false);
    } catch (error) {
      console.error('Failed to update entry:', error);
      // Fallback: update local state only
      setJournalEntries(prev => prev.map(entry =>
        (entry._id || entry.id) === entryId
          ? { ...entry, title: cleanedTitle, content: editedContent }
          : entry
      ));
      setSelectedEntry({ ...selectedEntry, title: cleanedTitle, content: editedContent });
      setIsEditingEntry(false);
    }
  };

  const handleAddEntry = async () => {
    // Strip HTML tags for validation
    const plainText = newEntry.replace(/<[^>]*>/g, '').trim();
    if (!plainText || plainText.length < 20) return;

    // Helper function to clean and capitalize title
    const cleanTitle = (title) => {
      if (!title) return undefined;
      // Strip HTML tags
      const plain = title.replace(/<[^>]*>/g, '').trim();
      if (!plain) return undefined;
      // Capitalize first letter of each word
      return plain
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    setIsAnalyzing(true);

    try {
      const cleanedTitle = cleanTitle(newEntryTitle);
      const response = await api.post('/enhanced-ai-career-coach/journal', {
        title: cleanedTitle || undefined,
        content: newEntry,
        mood: selectedMoodForEntry,
        categories: [selectedCategory]
      });

      const newEntryData = response?.data?.data || response?.data;
      if (!newEntryData) {
        throw new Error('Failed to create journal entry');
      }

      // Immediately trigger processing so user sees analysis like on Upload page
      try {
        const immediateId = newEntryData._id || newEntryData.entry_id;
        if (immediateId) {
          await api.post('/enhanced-ai-career-coach/process-journal', {
            content: plainText,
            entryId: immediateId
          });
        }
      } catch (_) { /* best-effort */ }

      // Update local state
      setJournalEntries(prev => [newEntryData, ...prev]);
      setSelectedEntry(newEntryData);

      // Reset form
      setNewEntry('');
      setNewEntryTitle('');
      setShowNewEntry(false);
      setSelectedMoodForEntry('neutral');
      setSelectedCategory('reflection');
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      // Fallback to localStorage
      const entryData = {
        _id: `local_${Date.now()}`,
        title: newEntryTitle || undefined,
        content: newEntry,
        mood: selectedMoodForEntry,
        categories: [selectedCategory],
        date: new Date().toISOString(),
        metadata: {
          wordCount: plainText.split(/\s+/).filter(Boolean).length
        }
      };

      setJournalEntries(prev => [entryData, ...prev]);
      setSelectedEntry(entryData);

      // Save to localStorage
      const stored = JSON.parse(localStorage.getItem('careerJournalEntries') || '[]');
      localStorage.setItem('careerJournalEntries', JSON.stringify([entryData, ...stored]));

      // Reset form
      setNewEntry('');
      setNewEntryTitle('');
      setShowNewEntry(false);
      setSelectedMoodForEntry('neutral');
      setSelectedCategory('reflection');
    } finally {
      setIsAnalyzing(false);
    }

    /* Uncomment to enable backend sync
    try {
      await aiCoachService.createJournalEntry(
        newEntry, 
        new Date().toISOString(), 
        [selectedCategory, selectedMoodForEntry].filter(Boolean)
      );
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      if (error?.response?.status === 402 || error?.message?.includes('Subscription')) {
        setUpgradeMessage('Your free trial has ended. Upgrade to continue using Career Memories and other premium features.');
        setShowUpgradeModal(true);
      }
    }
    */
  };

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.analysis?.topics || []).some(topic =>
        topic.toLowerCase().includes(searchTerm.toLowerCase())
      );
    // Safely handle date - support multiple date field names and validate
    const dateValue = entry.date || entry.entry_date || entry.createdAt || entry.updatedAt;
    let matchesDate = true;
    if (filterDate) {
      try {
        const entryDate = new Date(dateValue);
        const filterDateObj = new Date(filterDate);
        matchesDate = isSameDay(entryDate, filterDateObj);
      } catch (e) {
        matchesDate = false;
      }
    }
    const matchesMood = selectedMood === 'all' || entry.mood === selectedMood;
    const matchesCategory = selectedCategoryFilter === 'all' ||
      entry.category === selectedCategoryFilter ||
      (entry.categories && entry.categories.includes(selectedCategoryFilter));
    return matchesSearch && matchesDate && matchesMood && matchesCategory;
  });

  // Sort entries by date (newest first)
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateA = new Date(a.date || a.entry_date || a.createdAt || a.updatedAt || 0);
    const dateB = new Date(b.date || b.entry_date || b.createdAt || b.updatedAt || 0);
    return dateB - dateA;
  });

  // Auto-select first entry if none selected
  useEffect(() => {
    if (!selectedEntry && sortedEntries.length > 0) {
      setSelectedEntry(sortedEntries[0]);
    }
  }, [sortedEntries.length, selectedEntry]);

  // Navigate to Knowledge Base section based on category
  const handleViewInKnowledgeBase = (category) => {
    const cat = categories.find(c => c.value === category);
    if (cat && cat.knowledgeSection) {
      // Store the target section in localStorage for the Knowledge Base to pick up
      localStorage.setItem('knowledgeBaseTargetSection', cat.knowledgeSection);
      // Navigate to Knowledge Base
      navigate('/ai-career-coach-v2');
      // Trigger navigation to knowledge-base section after a brief delay
      setTimeout(() => {
        const event = new CustomEvent('navigateToKnowledgeBase', {
          detail: { section: cat.knowledgeSection }
        });
        window.dispatchEvent(event);
      }, 300);
    }
  };

  const stats = {
    total: journalEntries.length,
    thisWeek: journalEntries.filter(e => {
      const dateValue = e.date || e.entry_date || e.createdAt || e.updatedAt;
      if (!dateValue) return false;
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const entryDate = new Date(dateValue);
        return !isNaN(entryDate.getTime()) && entryDate >= weekAgo;
      } catch (err) {
        return false;
      }
    }).length,
    avgWords: journalEntries.length > 0
      ? Math.round(journalEntries.reduce((sum, e) =>
        sum + (e.metadata?.wordCount || 0), 0) / journalEntries.length)
      : 0
  };

  // Format date helper
  const formatEntryDate = (dateValue) => {
    if (!dateValue) return { day: '', weekday: '', full: '' };
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return { day: '', weekday: '', full: '' };
      return {
        day: format(date, 'd'),
        weekday: format(date, 'EEEE'),
        full: format(date, 'EEEE, MMMM d, yyyy')
      };
    } catch (e) {
      return { day: '', weekday: '', full: '' };
    }
  };

  // Get category color for entry
  const getCategoryColor = (categoryValue) => {
    if (!categoryValue) return '#9CA3AF';
    const category = categories.find(c => c.value === categoryValue ||
      (Array.isArray(categoryValue) && categoryValue.includes(c.value)));
    if (!category) return '#9CA3AF';

    // Map category colors to hex values
    const colorMap = {
      'bg-blue-100': '#3B82F6',
      'bg-green-100': '#10B981',
      'bg-yellow-100': '#F59E0B',
      'bg-purple-100': '#8B5CF6',
      'bg-red-100': '#EF4444',
      'bg-indigo-100': '#6366F1',
      'bg-gray-100': '#9CA3AF'
    };

    return colorMap[category.color] || '#9CA3AF';
  };

  // Get entry excerpt
  const getEntryExcerpt = (content, maxLength = 100) => {
    if (!content) return '';
    // Strip HTML tags
    const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex" data-tour="memories-content">
      {/* Left Column - Entry List + Filters (neutral styling, no green block) */}
      <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
        <div className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Calendar moved here so layout stays balanced */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-3">
            <CalendarWidget
              selectedDate={filterDate}
              onDateSelect={(date) => {
                setFilterDate(date);
                setSelectedEntry(null);
              }}
              entries={journalEntries}
              isCollapsed={isCalendarCollapsed}
              onToggle={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
            />
          </div>

          {/* Middle Column - Entry List */}
          {/* Sort Dropdown */}
          <div className="mb-4">
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <option>Newest First</option>
              <option>Oldest First</option>
            </select>
          </div>

          {/* Month Heading */}
          {sortedEntries.length > 0 && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {format(new Date(sortedEntries[0].date || sortedEntries[0].createdAt || Date.now()), 'MMMM yyyy')}
            </h3>
          )}

          {/* Entry List */}
          <div className="space-y-3">
            {isLoadingMemories ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400 gap-4">
                <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading memories...</p>
              </div>
            ) : sortedEntries.length === 0 ? (
              <div className="flex flex-col items-center text-center py-12 text-gray-500 dark:text-gray-400 gap-4">
                <Sparkles className="w-12 h-12 opacity-50" />
                <div>
                  <p className="font-semibold text-gray-700 dark:text-gray-200">No memories yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Capture a quick win, lesson, or challenge to get started.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewEntry(true)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-all"
                >
                  Start your first memory
                </button>
              </div>
            ) : (
              sortedEntries.map((entry) => {
                const entryId = entry._id || entry.id;
                const dateInfo = formatEntryDate(entry.date || entry.entry_date || entry.createdAt || entry.updatedAt);
                const isSelected = selectedEntry && (selectedEntry._id || selectedEntry.id) === entryId;
                const categoryColor = getCategoryColor(entry.category || entry.categories?.[0]);

                return (
                  <div
                    key={entryId}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${isSelected
                      ? 'bg-gray-100 dark:bg-gray-200 shadow-md'
                      : 'bg-white dark:bg-gray-50 hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-800">
                          {dateInfo.day}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-600 mt-1">
                          {dateInfo.weekday}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-800 mb-1 line-clamp-2">
                          {entry.title || getEntryExcerpt(entry.content, 50)}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-600 line-clamp-2">
                          {getEntryExcerpt(entry.content)}
                        </p>
                      </div>
                      <div
                        className="w-1 h-full rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(entry.category || entry.categories?.[0]) }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Entry Content */}
      <div className="flex-1 bg-white dark:bg-gray-50 overflow-y-auto">
        {selectedEntry ? (
          <div className="p-8">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-300">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    const currentIndex = sortedEntries.findIndex(e => (e._id || e.id) === (selectedEntry._id || selectedEntry.id));
                    if (currentIndex > 0) {
                      setSelectedEntry(sortedEntries[currentIndex - 1]);
                      setIsEditingEntry(false);
                    }
                  }}
                  disabled={sortedEntries.findIndex(e => (e._id || e.id) === (selectedEntry._id || selectedEntry.id)) === 0}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-700" />
                </button>
                <button
                  onClick={() => {
                    const currentIndex = sortedEntries.findIndex(e => (e._id || e.id) === (selectedEntry._id || selectedEntry.id));
                    if (currentIndex < sortedEntries.length - 1) {
                      setSelectedEntry(sortedEntries[currentIndex + 1]);
                      setIsEditingEntry(false);
                    }
                  }}
                  disabled={sortedEntries.findIndex(e => (e._id || e.id) === (selectedEntry._id || selectedEntry.id)) === sortedEntries.length - 1}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-700" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {!isEditingEntry ? (
                  <>
                    <button
                      onClick={() => {
                        alert('Coming Soon!\n\nVoice Input will allow you to record your journal entries using your microphone. The audio will be automatically transcribed to text.');
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-200 rounded-lg transition-colors"
                      title="Voice Input (Coming Soon)"
                    >
                      <Mic className="w-5 h-5 text-gray-600 dark:text-gray-700" />
                    </button>
                    <button
                      onClick={() => {
                        alert('Coming Soon!\n\nAttach Image will let you add photos, screenshots, or documents to your journal entries to provide visual context to your memories.');
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-200 rounded-lg transition-colors"
                      title="Attach Image (Coming Soon)"
                    >
                      <Camera className="w-5 h-5 text-gray-600 dark:text-gray-700" />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-200 rounded-lg transition-colors"
                      title="Share Entry"
                    >
                      <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-700" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(selectedEntry._id || selectedEntry.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
                    </button>
                    <button
                      onClick={handleEditEntry}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-200 rounded-lg transition-colors"
                      title="Edit Entry"
                    >
                      <Edit2 className="w-5 h-5 text-gray-600 dark:text-gray-700" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingEntry(false);
                        setEditedContent(selectedEntry.content || '');
                        setEditedTitle(selectedEntry.title || '');
                      }}
                      className="px-4 py-2 text-sm text-gray-600 dark:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowNewEntry(true)}
                  className="p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all hover:opacity-90"
                  title="New Entry"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Entry Content */}
            <div className="max-w-3xl">
              <div className="text-sm text-gray-600 dark:text-gray-600 mb-4">
                {formatEntryDate(selectedEntry.date || selectedEntry.entry_date || selectedEntry.createdAt || selectedEntry.updatedAt).full}
              </div>

              {isEditingEntry ? (
                <>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Entry Title"
                    className="text-3xl font-bold text-gray-900 dark:text-gray-800 mb-6 w-full border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none pb-2"
                  />
                  <RichTextEditor
                    content={editedContent}
                    onChange={setEditedContent}
                    isEditing={true}
                  />
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-800 mb-6">
                    {selectedEntry.title || 'Untitled Entry'}
                  </h1>
                  <RichTextEditor
                    content={selectedEntry.content || ''}
                    onChange={() => { }}
                    isEditing={false}
                  />
                </>
              )}

              {/* Category Badge with Knowledge Base Link */}
              {selectedEntry.category && (
                <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-300">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-600">Category:</span>
                  {(() => {
                    const category = categories.find(c => c.value === selectedEntry.category);
                    if (!category) return null;
                    const CategoryIcon = category.icon;
                    return (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium border border-blue-200 dark:border-blue-800">
                          <CategoryIcon className="w-4 h-4" />
                          {category.label}
                        </span>
                        <button
                          onClick={() => handleViewInKnowledgeBase(selectedEntry.category)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 dark:text-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-200"
                          title={`View ${category.label} insights in Knowledge Base`}
                        >
                          <Book className="w-3 h-3" />
                          View in Knowledge Base
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Tags */}
              {(selectedEntry.tags?.length > 0 || selectedEntry.analysis?.topics?.length > 0) && (
                <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-300">
                  {(selectedEntry.tags || selectedEntry.analysis?.topics || []).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-200 text-gray-700 dark:text-gray-700"
                    >
                      {tag}
                      <button
                        onClick={() => {
                          // Handle tag removal if needed
                        }}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center space-y-4">
              <BookOpen className="w-16 h-16 mx-auto opacity-50" />
              <div>
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  No entry selected
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Start a new memory to see it here.
                </p>
              </div>
              <button
                onClick={() => setShowNewEntry(true)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-all"
              >
                + New Memory
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'file')}
        accept=".pdf,.doc,.docx,.txt"
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'image')}
        accept="image/*"
      />

      {/* New Entry Modal */}
      {showNewEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  New Journal Entry
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Document your career journey
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNewEntry(false);
                  setNewEntry('');
                  setNewEntryTitle('');
                  setSelectedMoodForEntry('neutral');
                  setSelectedCategory('reflection');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newEntryTitle}
                  onChange={(e) => setNewEntryTitle(e.target.value)}
                  placeholder="Give your entry a title..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>

              {/* Mood Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  How are you feeling?
                </label>
                <div className="flex flex-wrap gap-2">
                  {moods.filter(m => m.value !== 'all').map((mood) => {
                    const MoodIcon = mood.icon;
                    return (
                      <button
                        key={mood.value}
                        type="button"
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${selectedMoodForEntry === mood.value
                          ? `bg-gradient-to-r ${mood.color} text-white shadow-md scale-105`
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:scale-105 hover:shadow-sm'
                          }`}
                        onClick={() => setSelectedMoodForEntry(mood.value)}
                      >
                        <MoodIcon className="w-4 h-4" />
                        {mood.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Category <span className="text-gray-400 font-normal text-xs">(Choose up to 1)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((category) => {
                    const CategoryIcon = category.icon;
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => setSelectedCategory(category.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-left hover:scale-105 ${selectedCategory === category.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        title={category.description}
                      >
                        <div className="flex items-start gap-2">
                          <CategoryIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {category.label}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                              {category.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Your Entry <span className="text-gray-400 font-normal">(min. 20 characters)</span>
                </label>
                <RichTextEditor
                  content={newEntry}
                  onChange={setNewEntry}
                  isEditing={true}
                />
                <div className="mt-2 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{newEntry.replace(/<[^>]*>/g, '').length} characters</span>
                  <span className="text-xs">Use formatting toolbar for bold, italic, lists, etc.</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button
                type="button"
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                onClick={() => {
                  setShowNewEntry(false);
                  setNewEntry('');
                  setNewEntryTitle('');
                  setSelectedMoodForEntry('neutral');
                  setSelectedCategory('reflection');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
                onClick={handleAddEntry}
                disabled={isAnalyzing || newEntry.replace(/<[^>]*>/g, '').trim().length < 20}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Entry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Delete Entry</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this entry? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const entryIdToDelete = showDeleteConfirm;
                  handleDeleteEntry(entryIdToDelete);
                }}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
        onUpgrade={() => {
          setShowUpgradeModal(false);
          alert('Redirecting to pricing page...');
        }}
      />
    </div>
  );
}

export default EnhancedMemoriesJournal;
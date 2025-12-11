import React, { useState, useEffect } from 'react';
import { aiCoachService } from '../../services/aiCoachService';

function MemoriesJournal() {
  const [journalEntries, setJournalEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState('');

  // Load from API
  useEffect(() => {
    (async () => {
      try {
        const resp = await aiCoachService.getJournalEntries({ page: 1, limit: 50 });
        const items = resp?.data?.entries || resp?.data || [];
        const normalized = items.map((it) => ({
          id: it._id || it.id,
          date: it.entry_date || it.date || it.createdAt,
          content: it.content,
          // Use standardized analysis structure
          sentiment: it.analysis?.sentiment_label || 
                    (it.analysis?.sentiment > 0.2 ? 'positive' : 
                     it.analysis?.sentiment < -0.2 ? 'negative' : 'neutral') ||
                    it.sentiment || 'neutral',
          sentimentScore: it.analysis?.sentiment || 0,
          topics: it.analysis?.topics || it.analysis?.key_themes || it.topics || [],
          keyThemes: it.analysis?.key_themes || [],
          actionItems: it.analysis?.action_items || [],
          skillsMentioned: it.analysis?.SKILLS_MENTIONED || [],
          frustrations: it.analysis?.FRUSTRATIONS || [],
          careerAspirations: it.analysis?.CAREER_ASPIRATIONS || [],
          skillGaps: it.analysis?.SKILL_GAPS || [],
          wordCount: it.metadata?.word_count || 
                    (it.content || '').trim().split(/\s+/).filter(Boolean).length,
          analysisStatus: it.analysis?.SUMMARY?.analysis_status || 'pending',
          source: it.source || 'web'
        }));
        setJournalEntries(normalized);
      } catch (e) {
        setJournalEntries([]);
      }
    })();
  }, []);

  const filteredEntries = journalEntries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDate = !filterDate || entry.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const handleAddEntry = () => {
    if (newEntry.trim()) {
      const entry = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        content: newEntry,
        sentiment: 'neutral', // Would be determined by AI
        topics: [], // Would be extracted by AI
        wordCount: newEntry.trim().split(/\s+/).length
      };
      setJournalEntries(prev => [entry, ...prev]);
      setNewEntry('');
      setShowNewEntry(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'negative': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'fas fa-smile';
      case 'negative': return 'fas fa-frown';
      default: return 'fas fa-meh';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            <i className="fas fa-journal-whills mr-3 text-green-500"></i>
            Career Memories
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your career journey and AI insights
          </p>
        </div>
        <button
          onClick={() => setShowNewEntry(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          New Entry
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search entries or topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:border-green-500"
          />
        </div>
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:border-green-500"
          />
        </div>
      </div>

      {/* New Entry Form */}
      {showNewEntry && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Add New Memory
          </h3>
          <textarea
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Share your career thoughts, experiences, or insights..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 min-h-[120px] resize-none"
          />
          <div className="flex justify-end space-x-3 mt-3">
            <button
              onClick={() => {
                setShowNewEntry(false);
                setNewEntry('');
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEntry}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Journal Entries Timeline */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <i className="fas fa-journal-whills text-4xl mb-4"></i>
            <p>No memories yet. Start documenting your career journey!</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(entry.sentiment)}`}>
                    <i className={`${getSentimentIcon(entry.sentiment)} mr-1`}></i>
                    {entry.sentiment}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {entry.wordCount} words
                </span>
              </div>
              
              <p className="text-gray-800 dark:text-gray-200 mb-3 leading-relaxed">
                {entry.content}
              </p>
              
              {/* Topics and Key Themes */}
              {(entry.topics.length > 0 || entry.keyThemes.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {[...entry.topics, ...entry.keyThemes].slice(0, 5).map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Skills Mentioned */}
              {entry.skillsMentioned.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Skills:</span>
                  {entry.skillsMentioned.slice(0, 5).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs rounded-full"
                    >
                      {skill.skill || skill.normalized_skill || skill}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Frustrations */}
              {entry.frustrations.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded">
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">Frustrations:</span>
                  <ul className="text-xs text-red-600 dark:text-red-400 mt-1 list-disc list-inside">
                    {entry.frustrations.slice(0, 3).map((frustration, index) => (
                      <li key={index}>
                        {frustration.frustration || frustration}
                        {frustration.severity && ` (Severity: ${frustration.severity}/10)`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Career Aspirations */}
              {entry.careerAspirations.length > 0 && (
                <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded">
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Career Goals:</span>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 mt-1 list-disc list-inside">
                    {entry.careerAspirations.slice(0, 2).map((aspiration, index) => (
                      <li key={index}>
                        {aspiration.role || aspiration.aspiration || aspiration}
                        {aspiration.timeline && ` (${aspiration.timeline})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Analysis Status */}
              {entry.analysisStatus && entry.analysisStatus !== 'completed' && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="italic">Analysis: {entry.analysisStatus}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Progress Visualization */}
      <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          <i className="fas fa-chart-line mr-2 text-green-500"></i>
          Memories Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {journalEntries.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Entries
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round((journalEntries.filter(e => e.sentiment === 'positive').length / journalEntries.length) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Positive Sentiment
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(journalEntries.reduce((acc, entry) => acc + entry.wordCount, 0) / journalEntries.length) || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Words/Entry
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoriesJournal;

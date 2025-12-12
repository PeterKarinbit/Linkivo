import React, { useState, useEffect } from 'react';
import { FiActivity, FiMessageSquare, FiUsers, FiCheckCircle, FiXCircle, FiChevronDown, FiChevronUp, FiMinimize2, FiMaximize2 } from 'react-icons/fi';

function AICollaborationDashboard({ mcpServer, aiAgents }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [agentStatus, setAgentStatus] = useState({});
  const [messageHistory, setMessageHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update dashboard data
  const updateDashboard = () => {
    if (!mcpServer) return;

    try {
      const status = mcpServer.getAgentStatus();
      const messages = mcpServer.getMessageHistory(20);
      const healthData = mcpServer.getHealth();

      setAgentStatus(status);
      setMessageHistory(messages);
      setHealth(healthData);
    } catch (error) {
      console.error('Error updating dashboard:', error);
    }
  };

  // Auto-refresh every 2 seconds
  useEffect(() => {
    updateDashboard();

    if (autoRefresh) {
      const interval = setInterval(updateDashboard, 2000);
      return () => clearInterval(interval);
    }
  }, [mcpServer, autoRefresh]);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString();
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'inactive': return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  // Get message status icon
  const getMessageIcon = (status) => {
    switch (status) {
      case 'completed': return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <FiXCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default: return <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />;
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <FiActivity className="w-4 h-4" />
          <span className="text-sm font-medium">AI Collaboration</span>
          {health && health.activeAgents > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {health.activeAgents} active
            </span>
          )}
        </button>
      </div>
    );
  }

  const agentEntries = Object.entries(agentStatus);
  const recentMessages = messageHistory.slice(0, isExpanded ? 20 : 5);

  return (
    <div className="fixed bottom-4 right-4 z-40 w-96 max-w-[calc(100vw-2rem)]">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiActivity className="w-5 h-5" />
            <h3 className="font-semibold text-sm">AI Collaboration</h3>
            {health && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {health.activeAgents}/{health.totalAgents} agents
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-1.5 rounded hover:bg-white/20 transition-colors ${
                autoRefresh ? 'bg-white/20' : ''
              }`}
              title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              <div className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-300' : 'bg-gray-300'}`} />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded hover:bg-white/20 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded hover:bg-white/20 transition-colors"
              title="Minimize"
            >
              <FiMinimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[600px] overflow-y-auto">
          {/* Health Metrics */}
          {health && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Messages</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{health.totalMessages}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Success Rate</div>
                  <div className="text-lg font-bold text-green-600">{health.successRate.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Agent Status */}
          {agentEntries.length > 0 && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <FiUsers className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Agents</h4>
              </div>
              <div className="space-y-2">
                {agentEntries.map(([agentId, agent]) => (
                  <div
                    key={agentId}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {agentId}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {agent.messageCount} msgs • {agent.errorCount} errors
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(agent.status)}`}>
                      {agent.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message History */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <FiMessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Messages</h4>
            </div>
            {recentMessages.length > 0 ? (
              <div className="space-y-2">
                {recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-white">
                          <span className="text-purple-600 dark:text-purple-400">{msg.from}</span>
                          {' → '}
                          <span className="text-indigo-600 dark:text-indigo-400">{msg.to}</span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {msg.message?.type || 'message'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getMessageIcon(msg.status)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                    {msg.responseTime && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Response: {msg.responseTime}ms
                      </div>
                    )}
                    {msg.error && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Error: {msg.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                <FiMessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-xs mt-1">AI agents will appear here when they communicate</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Real-time monitoring</span>
          <button
            onClick={updateDashboard}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default AICollaborationDashboard;






































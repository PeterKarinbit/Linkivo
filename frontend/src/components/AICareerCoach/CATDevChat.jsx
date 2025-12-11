import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiMessageSquare, FiX, FiMinimize2, FiMaximize2, FiLock } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/apiBase';

function Ivo({ embedded = false }) {
  const navigate = useNavigate();
  const { userData } = useSelector((store) => store.auth);
  const isPremium = userData?.subscription?.plan === 'premium' || userData?.subscription?.plan === 'pro';

  const [isOpen, setIsOpen] = useState(embedded);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageCount, setMessageCount] = useState(0); // Track free messages
  const [userContext, setUserContext] = useState(null); // User profile context
  const FREE_MESSAGE_LIMIT = 5; // Allow 5 free messages

  // Fetch user context on mount
  useEffect(() => {
    const fetchUserContext = async () => {
      try {
        const [profileRes, roadmapRes] = await Promise.allSettled([
          api.get('/api/v1/enhanced-ai-career-coach/profile'),
          api.get('/api/v1/enhanced-ai-career-coach/roadmap')
        ]);
        
        const profile = profileRes.status === 'fulfilled' ? profileRes.value.data.data : null;
        const roadmap = roadmapRes.status === 'fulfilled' ? roadmapRes.value.data.data?.roadmap : null;
        
        setUserContext({
          targetRole: profile?.persona_profile?.target_role || roadmap?.targetRole,
          currentLevel: profile?.persona_profile?.current_level,
          skills: Object.keys(profile?.resume_analysis?.skills_heat_map || {}).slice(0, 10),
          roadmapPhase: roadmap?.phases?.find(p => !p.completed)?.title,
          weeklyHours: roadmap?.weekly_hours_budget || profile?.persona_profile?.weekly_time
        });
      } catch (error) {
        console.error('Error fetching user context:', error);
      }
    };
    
    fetchUserContext();
  }, []);

  // If embedded, we don't toggle open/close, it's always open in the UI
  useEffect(() => {
    if (embedded) {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [embedded]);

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: isPremium
        ? `Hi! I'm Ivo, your AI Career Coach. ${userContext?.targetRole ? `I see you're working towards becoming a ${userContext.targetRole}. ` : ''}How can I help you with your career development today?`
        : `Hi! I'm Ivo, your AI Career Coach. ${userContext?.targetRole ? `I see you're working towards becoming a ${userContext.targetRole}. ` : ''}You have ${FREE_MESSAGE_LIMIT} free messages to try me out. Upgrade to Premium for unlimited access!`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && !embedded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, embedded]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Check premium status
    if (!isPremium && messageCount >= FREE_MESSAGE_LIMIT) {
      const upgradeMessage = {
        id: Date.now(),
        text: "You've reached your free message limit. Upgrade to Premium for unlimited AI coaching!",
        sender: 'bot',
        timestamp: new Date(),
        isUpgrade: true
      };
      setMessages(prev => [...prev, upgradeMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build context-aware prompt
      const conversationContext = messages.slice(-5).map(msg =>
        `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`
      ).join('\n');

      // Build user context string
      const contextParts = [];
      if (userContext?.targetRole) {
        contextParts.push(`Target Role: ${userContext.targetRole}`);
      }
      if (userContext?.currentLevel) {
        contextParts.push(`Current Level: ${userContext.currentLevel}`);
      }
      if (userContext?.skills && userContext.skills.length > 0) {
        contextParts.push(`Top Skills: ${userContext.skills.join(', ')}`);
      }
      if (userContext?.roadmapPhase) {
        contextParts.push(`Current Roadmap Phase: ${userContext.roadmapPhase}`);
      }
      if (userContext?.weeklyHours) {
        contextParts.push(`Weekly Hours Available: ${userContext.weeklyHours}`);
      }

      const userContextStr = contextParts.length > 0 
        ? `\n\nUser Context:\n${contextParts.join('\n')}`
        : '';

      const fullPrompt = `You are Ivo, a friendly and knowledgeable AI Career Coach. Use the user's context to provide personalized advice.

${userContextStr}

Conversation History:
${conversationContext || 'No previous conversation'}

User: ${userMessage.text}

Please respond as Ivo, using the user's context to provide relevant, personalized career advice.`;

      // Use the dev chat endpoint which is the correct backend endpoint
      // Use longer timeout for LLM calls (30 seconds)
      const response = await api.post('/enhanced-ai-career-coach/dev/chat', {
        prompt: fullPrompt
      }, { timeout: 30000 });


      const botResponse = response?.data?.data?.text ||
        response?.data?.text ||
        response?.text ||
        'I apologize, but I encountered an error. Please try again.';

      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Increment message count for free users
      if (!isPremium) {
        setMessageCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // More detailed error message
      let errorText = "I'm having trouble connecting right now. Please try again in a moment.";

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorText = "The response took too long. The AI service might be busy. Please try again.";
      } else if (error.response?.status === 401) {
        errorText = "Your session has expired. Please refresh the page and try again.";
      } else if (error.response?.status === 500) {
        errorText = "The AI service is temporarily unavailable. Please try again in a few minutes.";
      } else if (error.message?.includes('Network Error')) {
        errorText = "Network connection issue. Please check your internet connection.";
      } else if (error.response?.data?.data?.text) {
        // The backend returned an error message in the response
        errorText = error.response.data.data.text;
      }


      const errorMessage = {
        id: Date.now() + 1,
        text: errorText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }

  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen && !embedded) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
      >
        <FiMessageSquare className="w-6 h-6" />
        <span className="hidden md:block font-medium">Chat with Ivo</span>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      </button>
    );
  }

  if (isMinimized && !embedded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <FiMessageSquare className="w-5 h-5" />
          <span className="font-medium">Ivo</span>
          {messages.length > 1 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {messages.filter(m => m.sender === 'user').length}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Common classes for both modes
  const containerClasses = embedded
    ? "w-full h-full flex flex-col min-h-[500px]"
    : "fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]";

  const windowClasses = embedded
    ? "bg-transparent flex flex-col h-full"
    : "bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[600px] max-h-[calc(100vh-8rem)]";

  return (
    <div className={containerClasses}>
      <div className={windowClasses}>
        {/* Header - Only show if NOT embedded (Dashboard has its own header) or if we want a header in embedded too. 
            The DashboardView provides a header, so we can skip it or simplify it.
            Let's hide it for embedded to match the design. */}
        {!embedded && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FiMessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Ivo - Your Career Coach</h3>
                <p className="text-xs opacity-90">Ask me anything about your career</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Minimize"
              >
                <FiMinimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Close"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-t-xl md:rounded-none">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${message.sender === 'user'
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700'
                  }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                <p className={`text-[10px] mt-1.5 ${message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                  }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={`p-4 ${embedded ? 'bg-transparent' : 'border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
          <div className="flex items-end gap-2 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your career, goals, or skills..."
              rows={1}
              className="flex-1 pl-4 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm resize-none max-h-32 transition-all min-h-[50px]"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all"
              title="Send message"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </div>

          {/* Message counter and upgrade prompt for free users */}
          {!isPremium && (
            <div className="mt-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {messageCount >= FREE_MESSAGE_LIMIT ? (
                    <span className="text-red-500 font-medium">✋ Free limit reached</span>
                  ) : (
                    <span>{FREE_MESSAGE_LIMIT - messageCount} free messages remaining</span>
                  )}
                </span>
              </div>
              <button
                onClick={() => navigate('/upgrade')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-sm hover:shadow hover:scale-105"
              >
                <FiLock className="w-3 h-3" />
                Upgrade
              </button>
            </div>
          )}

          {!embedded && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ivo;

































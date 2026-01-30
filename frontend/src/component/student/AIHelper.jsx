import React, { useState, useRef, useEffect } from 'react';
import { authenticatedFetch } from '../../utils/auth';
import { 
  IconSend, 
  IconLoader, 
  IconTrash, 
  IconDownload,
  IconCopy,
  IconCheck,
  IconBulb,
  IconBook,
  IconCalculator,
  IconClock,
  IconSettings
} from '@tabler/icons-react';

export default function AIHelper() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showContextOptions, setShowContextOptions] = useState(false);
  const [contextOptions, setContextOptions] = useState({
    includeGrades: true,
    includeSchedule: true,
    includeSubjects: true
  });
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'assistant', 
      text: "Hi! I'm your BukSU Academic Assistant. I can help you understand your grades, explain academic concepts, provide study tips, or answer questions about your coursework. I have access to your personal academic data to give you specific, personalized assistance. How can I assist you today?",
      timestamp: new Date().toISOString()
    },
  ]);
  const [copied, setCopied] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendText = async (text) => {
    const t = String(text || '').trim();
    if (!t) return;
    
    const userMsg = { 
      id: Date.now(), 
      role: 'user', 
      text: t,
      timestamp: new Date().toISOString()
    };
    setMessages((m) => [...m, userMsg]);
    
    // Add typing indicator
    const typingId = 'typing-' + Date.now();
    const typingMsg = { id: typingId, role: 'assistant', typing: true };
    setMessages((m) => [...m, typingMsg]);
    
    setLoading(true);
    setError(null);

    try {
      console.log('Sending AI request with context options:', contextOptions);
      
      const response = await authenticatedFetch('http://localhost:5000/api/ai/generate-with-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: t,
          ...contextOptions,
          maxOutputTokens: 500,
          temperature: 0.7
        })
      });

      console.log('AI response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('AI response data:', data);
        
        const assistantText = data.text || 'I apologize, but I couldn\'t process your request. Please try asking again.';
        const assistantMsg = { 
          id: Date.now() + 1, 
          role: 'assistant', 
          text: assistantText,
          timestamp: new Date().toISOString()
        };
        
        setMessages((m) => m.map((msg) => (msg.id === typingId ? assistantMsg : msg)));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('AI request failed:', response.status, errorData);
        throw new Error(`Server error: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('AI generate error', err);
      setError(err.message);
      
      const errMsg = { 
        id: Date.now() + 2, 
        role: 'assistant', 
        text: 'I\'m having trouble accessing your academic data right now. Please check your connection and try again.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages((m) => m.map((msg) => (msg.id === typingId ? errMsg : msg)));
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    await sendText(text);
  };

  const clearChat = () => {
    setMessages([{
      id: 1, 
      role: 'assistant', 
      text: "Chat cleared! I'm here to help with your academic questions.",
      timestamp: new Date().toISOString()
    }]);
  };

  const copyMessage = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(messageId);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const exportChat = () => {
    const chatContent = messages
      .filter(m => !m.typing)
      .map(m => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buksu-ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const quickPrompts = [
    { text: "Explain my current GPA", icon: IconCalculator, category: "grades" },
    { text: "Give me study tips for better performance", icon: IconBulb, category: "study" },
    { text: "How can I improve my grades?", icon: IconBook, category: "improvement" },
    { text: "Help me manage my time better", icon: IconClock, category: "planning" }
  ];

  return (
    <div className="flex flex-col h-full max-h-[500px] bg-gradient-to-b from-blue-50/30 to-white">
      {/* Compact Chat Actions Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-300 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600 font-medium">AI with Academic Data</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setShowContextOptions(!showContextOptions)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Context settings"
          >
            <IconSettings className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={exportChat}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Export chat"
            disabled={messages.length <= 1}
          >
            <IconDownload className="w-3 h-3 text-gray-500" />
          </button>
          <button
            onClick={clearChat}
            className="p-1 rounded hover:bg-red-50 transition-colors"
            title="Clear chat"
          >
            <IconTrash className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>

      {/* Context Options Panel */}
      {showContextOptions && (
        <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
          <div className="text-xs font-semibold text-blue-700 mb-1">AI has access to:</div>
          <div className="flex flex-wrap gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={contextOptions.includeGrades}
                onChange={(e) => setContextOptions(prev => ({ ...prev, includeGrades: e.target.checked }))}
                className="w-3 h-3"
              />
              <span className="text-blue-700">My Grades</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={contextOptions.includeSchedule}
                onChange={(e) => setContextOptions(prev => ({ ...prev, includeSchedule: e.target.checked }))}
                className="w-3 h-3"
              />
              <span className="text-blue-700">My Schedule</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={contextOptions.includeSubjects}
                onChange={(e) => setContextOptions(prev => ({ ...prev, includeSubjects: e.target.checked }))}
                className="w-3 h-3"
              />
              <span className="text-blue-700">My Subjects</span>
            </label>
          </div>
        </div>
      )}

      {/* Scrollable Messages Container */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-0" style={{ maxHeight: '350px' }}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.typing ? (
              <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg shadow-sm max-w-[80%]">
                <div className="flex items-center gap-1">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">Thinking...</span>
                </div>
              </div>
            ) : (
              <div className={`group max-w-[80%] ${m.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                <div className={`relative px-3 py-2 rounded-lg shadow-sm break-words text-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : m.isError 
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-bl-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}>
                  <div className="whitespace-pre-wrap leading-snug">{m.text}</div>
                  
                  {m.role === 'assistant' && !m.isError && (
                    <button
                      onClick={() => copyMessage(m.text, m.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100"
                      title="Copy message"
                    >
                      {copied === m.id ? (
                        <IconCheck className="w-2.5 h-2.5 text-green-600" />
                      ) : (
                        <IconCopy className="w-2.5 h-2.5 text-gray-500" />
                      )}
                    </button>
                  )}
                </div>
                
                {m.timestamp && (
                  <div className={`text-xs text-gray-400 mt-0.5 px-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Compact Quick Prompts */}
        {messages.length === 1 && (
          <div className="space-y-2 mt-2">
            <div className="text-xs text-gray-500 text-center">Quick start:</div>
            <div className="grid grid-cols-1 gap-1">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => sendText(prompt.text)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group text-xs"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <prompt.icon className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compact Input Section */}
      <div className="border-t border-gray-300 bg-white/90 backdrop-blur-sm">
        {/* center items so textarea and button align vertically */}
        <div className="flex items-center gap-2 p-2">
          <div className="flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="w-full  rounded-lg px-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-transparent resize-none transition-all text-sm h-9 leading-tight"
              placeholder="Ask about grades, courses..."
              rows="1"
              style={{ maxHeight: '80px' }}
              disabled={loading}
            />
          </div>
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 flex items-center justify-center transition-all"
            aria-label="Send message"
          >
            {loading ? (
              <IconLoader className="w-4 h-4 animate-spin text-white" />
            ) : (
              <IconSend className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {error && (
          <div className="px-2 pb-2">
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              <strong>Error:</strong> {String(error)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { authenticatedFetch } from '../../utils/auth';

export default function StudentAIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [contextOptions, setContextOptions] = useState({
    includeGrades: true,
    includeSchedule: true,
    includeSubjects: true
  });

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      console.log('Sending AI request with context options:', contextOptions);
      
      const requestBody = {
        prompt: input,
        ...contextOptions,
        maxOutputTokens: 1000,
        temperature: 0.7
      };
      
      console.log('Request body:', requestBody);
      
      const response = await authenticatedFetch('/api/ai/generate-with-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('AI response data:', data);
        const aiMessage = { type: 'ai', content: data.text };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('AI request failed:', response.status, errorData);
        throw new Error(`Server responded with ${response.status}: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('AI request failed:', error);
      const errorMessage = { 
        type: 'error', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Academic Assistant</h2>
        <p className="text-gray-600">Ask questions about your grades, subjects, schedule, or academic progress!</p>
      </div>

      {/* Context Options */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Include in AI Context:</h3>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={contextOptions.includeGrades}
              onChange={(e) => setContextOptions(prev => ({ ...prev, includeGrades: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">My Grades</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={contextOptions.includeSchedule}
              onChange={(e) => setContextOptions(prev => ({ ...prev, includeSchedule: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">My Schedule</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={contextOptions.includeSubjects}
              onChange={(e) => setContextOptions(prev => ({ ...prev, includeSubjects: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">My Subjects</span>
          </label>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Hi! I'm your AI academic assistant.</p>
            <p>You can ask me questions like:</p>
            <ul className="mt-2 text-sm">
              <li>• "What's my current GPA?"</li>
              <li>• "Which subjects am I struggling with?"</li>
              <li>• "What assignments do I have this week?"</li>
              <li>• "How can I improve my grades?"</li>
            </ul>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : message.type === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-white text-gray-800 border'
            }`}>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="text-left mb-4">
            <div className="inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white text-gray-800 border">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about your academics..."
          className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          disabled={loading}
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
          <button
            onClick={clearChat}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-4 text-xs text-gray-500">
        <p><strong>Tips:</strong></p>
        <ul className="list-disc list-inside mt-1">
          <li>Be specific in your questions for better answers</li>
          <li>Use context options above to control what information the AI can access</li>
          <li>Press Enter to send, Shift+Enter for new line</li>
        </ul>
      </div>
    </div>
  );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import { AgentResponse } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  response?: AgentResponse;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Skylark Drones Business Intelligence Agent. I can help you analyze pipeline, operations, sectors, and customer performance. Try asking "How is our pipeline?" or "What are the biggest risks?"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setError(null);
    setLoading(true);

    // Prior turns, sent to the backend so the agent has conversation context
    // (needed for follow-ups and for the user to answer a clarifying
    // question the agent asked last turn). Capped to the last 10 messages.
    const history = messages
      .map(m => ({ role: m.role, content: m.content }))
      .slice(-10);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, history }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to get response');
      }

      const data: AgentResponse = await response.json();

      // Add assistant message with response
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          response: data,
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered an error: ${errorMessage}. Please try again or rephrase your question.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exampleQuestions = [
    'How is our pipeline looking?',
    'What are the biggest pipeline risks?',
    'Compare Energy vs Infrastructure sectors',
    'Which customers have the largest deals?',
    'What is our operational health?',
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">SD</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Skylark Drones</h1>
              <p className="text-xs text-slate-600">AI Business Intelligence Agent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.length === 1 ? (
            // Initial state with examples
            <div className="p-8 space-y-6">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Ask me anything about your business</h2>
                <p className="text-slate-600">Query your pipeline, operations, and customer data in seconds</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exampleQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(question);
                      setTimeout(() => {
                        (document.querySelector('form') as HTMLFormElement)?.dispatchEvent(
                          new Event('submit', { bubbles: true })
                        );
                      }, 0);
                    }}
                    className="p-4 text-left bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all text-slate-700 hover:text-slate-900"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💬</span>
                      <span className="text-sm font-medium">{question}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat messages
            <div className="space-y-4 p-4 md:p-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-2xl ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-lg rounded-tr-none'
                        : 'bg-white text-slate-900 rounded-lg rounded-tl-none border border-slate-200'
                    } px-4 py-3`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    {/* Response details for assistant messages */}
                    {msg.response && msg.role === 'assistant' && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                        {msg.response.insights.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Key Insights:</p>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {msg.response.insights.map((insight, i) => (
                                <li key={i} className="flex gap-2">
                                  <span>✨</span>
                                  <span>{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {msg.response.risks.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Risks to Monitor:</p>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {msg.response.risks.map((risk, i) => (
                                <li key={i} className="flex gap-2">
                                  <span>⚠️</span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {msg.response.dataQualityCaveats.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-700 mb-1">Data Quality Notes:</p>
                            <ul className="text-xs text-slate-500 space-y-1">
                              {msg.response.dataQualityCaveats.map((caveat, i) => (
                                <li key={i} className="flex gap-2">
                                  <span>ℹ️</span>
                                  <span>{caveat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                          Sources: {msg.response.sources.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-900 rounded-lg rounded-tl-none px-4 py-3 border border-slate-200">
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-xs text-slate-600">Analyzing data...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  Error: {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-slate-200 shadow-lg">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pipeline, operations, sectors, or customers..."
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 font-medium text-sm transition-colors"
            >
              {loading ? 'Analyzing...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { AgentResponse } from '@/lib/types';
import { BrandIcon, ChatIcon, SparkleIcon, WarningIcon, InfoIcon, SendIcon, LinkIcon } from './icons';

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
    'Give me a leadership update',
  ];

  return (
    <div className="flex flex-col h-screen bg-ink-950">
      {/* Header */}
      <div className="bg-ink-900 border-b border-ink-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sand-200 rounded-2xl flex items-center justify-center shrink-0">
              <BrandIcon className="text-ink-900" width={20} height={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white leading-tight">Skylark Drones</h1>
              <p className="text-xs text-accent-300">AI Business Intelligence Agent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.length === 1 ? (
            // Initial state with examples
            <div className="p-6 md:p-8 space-y-6">
              <div className="text-center mb-10 mt-4">
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">Ask me anything about your business</h2>
                <p className="text-sand-100/60 text-sm">Query your pipeline, operations, and customer data in seconds</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    className="p-4 text-left bg-ink-800 rounded-2xl border border-ink-700 hover:border-accent-400/60 hover:bg-ink-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-ink-700 flex items-center justify-center shrink-0">
                        <ChatIcon className="text-accent-400" width={16} height={16} />
                      </div>
                      <span className="text-sm font-medium text-sand-100">{question}</span>
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
                        ? 'bg-sand-200 text-ink-900 rounded-3xl rounded-tr-md'
                        : 'bg-ink-800 text-sand-100 rounded-3xl rounded-tl-md border border-ink-700'
                    } px-5 py-4`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    {/* Response details for assistant messages */}
                    {msg.response && msg.role === 'assistant' && (
                      <div className="mt-4 pt-4 border-t border-ink-700 space-y-3">
                        {msg.response.insights.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-5 h-5 rounded-md bg-accent-400/15 flex items-center justify-center">
                                <SparkleIcon className="text-accent-400" width={12} height={12} />
                              </span>
                              <p className="text-xs font-semibold text-accent-300">Key Insights</p>
                            </div>
                            <ul className="text-xs text-sand-100/75 space-y-1 pl-7">
                              {msg.response.insights.map((insight, i) => (
                                <li key={i}>{insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {msg.response.risks.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-5 h-5 rounded-md bg-warn-400/15 flex items-center justify-center">
                                <WarningIcon className="text-warn-400" width={12} height={12} />
                              </span>
                              <p className="text-xs font-semibold text-warn-300">Risks to Monitor</p>
                            </div>
                            <ul className="text-xs text-sand-100/75 space-y-1 pl-7">
                              {msg.response.risks.map((risk, i) => (
                                <li key={i}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {msg.response.dataQualityCaveats.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-5 h-5 rounded-md bg-sand-200/15 flex items-center justify-center">
                                <InfoIcon className="text-sand-200" width={12} height={12} />
                              </span>
                              <p className="text-xs font-semibold text-sand-200">Data Quality Notes</p>
                            </div>
                            <ul className="text-xs text-sand-100/65 space-y-1 pl-7">
                              {msg.response.dataQualityCaveats.map((caveat, i) => (
                                <li key={i}>{caveat}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="flex items-center gap-1.5 text-xs text-sand-100/40 pt-2 border-t border-ink-700/70">
                          <LinkIcon width={11} height={11} />
                          Sources: {msg.response.sources.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-ink-800 text-sand-100 rounded-3xl rounded-tl-md px-5 py-4 border border-ink-700">
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-xs text-sand-100/60">Analyzing data...</span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-warn-400/10 border border-warn-400/30 rounded-2xl px-4 py-3 text-sm text-warn-300 flex items-center gap-2">
                  <WarningIcon width={14} height={14} />
                  Error: {error}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="bg-ink-900 border-t border-ink-700">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about pipeline, operations, sectors, or customers..."
              disabled={loading}
              className="flex-1 px-5 py-3 rounded-full bg-ink-800 border border-ink-700 text-sm text-sand-100 placeholder-sand-100/35 focus:outline-none focus:border-accent-400/70 focus:ring-1 focus:ring-accent-400/40 disabled:opacity-60 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="w-11 h-11 shrink-0 rounded-full bg-accent-400 hover:bg-accent-500 disabled:bg-ink-700 disabled:text-ink-500 text-ink-950 flex items-center justify-center transition-colors"
            >
              <SendIcon width={18} height={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

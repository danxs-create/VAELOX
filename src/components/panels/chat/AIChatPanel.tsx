'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useVaeloxAgent } from './useVaeloxAgent';
import {
  Send,
  Paperclip,
  Bot,
  User,
  MoreVertical,
  StopCircle,
  RefreshCw,
  Sparkles,
  Search,
  MessageSquare,
  Clock,
  Pin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

export function AIChatPanel() {
  const { messages, isGenerating, sendMessage, stopGeneration } = useVaeloxAgent();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const handleSend = () => {
    if (input.trim() && !isGenerating) {
      sendMessage(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-vaelox-panel text-vaelox-text w-full">
      {/* Header */}
      <div className="flex-none p-3 border-b border-vaelox-border/50 flex justify-between items-center bg-vaelox-surface/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-sm">New Conversation</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 rounded hover:bg-vaelox-surface text-vaelox-muted"
            aria-label="History"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-vaelox-surface text-vaelox-muted"
            aria-label="Pin"
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-vaelox-surface text-vaelox-muted"
            aria-label="More"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-brand-500" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">How can I help you?</h3>
              <p className="text-sm text-vaelox-muted max-w-[250px]">
                Ask me about your workspace, generate code, or execute agentic workflows.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3 max-w-full',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              {/* Avatar */}
              <div className="flex-none mt-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    msg.role === 'user'
                      ? 'bg-vaelox-surface border border-vaelox-border'
                      : 'bg-brand-500/10 text-brand-500',
                  )}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'flex-1 min-w-0 flex flex-col gap-1',
                  msg.role === 'user' ? 'items-end' : 'items-start',
                )}
              >
                {msg.role === 'assistant' && msg.thinkingState && (
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="text-xs text-brand-400 font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                      {msg.thinkingState.status}
                    </div>
                    {msg.thinkingState.details.length > 0 && (
                      <div className="text-[10px] text-vaelox-muted font-mono border-l-2 border-vaelox-border/50 pl-2 ml-1">
                        {msg.thinkingState.details.map((detail, idx) => (
                          <div key={idx}>{detail}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[95%] prose prose-invert prose-p:leading-relaxed prose-pre:my-2 prose-pre:bg-vaelox-surface/50 prose-pre:border prose-pre:border-vaelox-border prose-code:text-vaelox-text',
                    msg.role === 'user'
                      ? 'bg-vaelox-surface border border-vaelox-border rounded-tr-sm'
                      : 'bg-transparent',
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {msg.content}
                  </ReactMarkdown>

                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-brand-500 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="flex-none p-3 pb-safe border-t border-vaelox-border/50 bg-vaelox-panel/90 backdrop-blur">
        <div className="relative group">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Vaelox (@ for models, / for commands)"
            className="w-full bg-vaelox-surface border border-vaelox-border rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none max-h-[200px] no-scrollbar text-vaelox-text placeholder:text-vaelox-muted transition-colors shadow-sm"
            rows={1}
            disabled={isGenerating}
          />

          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {isGenerating ? (
              <button
                onClick={stopGeneration}
                className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                aria-label="Stop Generation"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action buttons left side */}
          <div className="absolute left-3 bottom-2 flex items-center gap-2 pointer-events-none">
            {/* Can add attachment pin here if we add pl-12 to textarea */}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 px-1">
          <div className="flex gap-2 text-xs text-vaelox-muted">
            <button className="flex items-center gap-1 hover:text-vaelox-text transition-colors">
              <Paperclip className="w-3.5 h-3.5" /> Attach
            </button>
            <button className="flex items-center gap-1 hover:text-vaelox-text transition-colors">
              <Bot className="w-3.5 h-3.5" /> Gemini Pro
            </button>
          </div>
          <div className="text-[10px] text-vaelox-muted font-mono">
            {input.length > 0 ? `~${Math.ceil(input.length / 4)} tokens` : '0 tokens'}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as aiService from '@/services/ai-service';
import { useAuthStore } from '@/store/auth-store';
import { useTradeShowStore } from '@/store/trade-show-store';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIChatWidget({ isOpen, onClose }: AIChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const organization = useAuthStore((s) => s.organization);
  const { shows, allAttendees } = useTradeShowStore();

  // Load API key status on mount
  useEffect(() => {
    async function loadKeyStatus() {
      if (!organization?.id || !isOpen) return;
      
      aiService.setCurrentOrg(organization.id);
      
      if (!aiService.isKeyLoadedFromDb()) {
        try {
          await aiService.loadApiKeyFromOrg(supabase, organization.id);
        } catch (e) {
          console.error('Failed to load AI key status:', e);
        }
      }
      
      setHasApiKey(aiService.hasApiKey());
    }
    
    loadKeyStatus();
  }, [isOpen, organization?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && hasApiKey) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, hasApiKey]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build attendee context grouped by show
      const attendeesByShow: Record<string, Array<{ name: string | null; email: string | null; arrivalDate: string | null; departureDate: string | null }>> = {};
      allAttendees.forEach(a => {
        const show = shows.find(s => s.id === a.tradeshowId);
        const showName = show?.name || `Show #${a.tradeshowId}`;
        if (!attendeesByShow[showName]) {
          attendeesByShow[showName] = [];
        }
        attendeesByShow[showName].push({
          name: a.name,
          email: a.email,
          arrivalDate: a.arrivalDate,
          departureDate: a.departureDate,
        });
      });

      // Build show context - pass raw shows array with all fields
      const showContext = shows.length > 0 ? {
        shows: shows as unknown as Array<Record<string, unknown>>, // Pass raw shows — all fields accessible dynamically
        attendeesByShow: Object.keys(attendeesByShow).length > 0 ? attendeesByShow : undefined,
      } : undefined;

      const response = await aiService.chatWithAssistant({
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content,
        })),
        showContext,
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Please try again.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'fixed bottom-24 right-6 z-50',
        'w-[380px] max-w-[calc(100vw-48px)]',
        'h-[500px] max-h-[calc(100vh-120px)]',
        'bg-surface rounded-2xl shadow-2xl border border-border',
        'flex flex-col overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-text-primary">Show Assistant</h3>
            <p className="text-xs text-text-tertiary">Ask me anything</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-secondary transition-colors"
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!hasApiKey ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
            <Sparkles size={24} className="text-warning" />
          </div>
          <h4 className="font-medium text-text-primary mb-1">API Key Required</h4>
          <p className="text-xs text-text-secondary mb-4">
            Add your Claude API key in Settings → AI Assistant
          </p>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-text-tertiary mb-4">
                  Hi! I&apos;m your trade show assistant. Ask me about:
                </p>
                <div className="space-y-2 text-xs text-text-secondary">
                  <p>• Your upcoming shows and deadlines</p>
                  <p>• Booth preparation tips</p>
                  <p>• Lead follow-up strategies</p>
                  <p>• Budget and ROI questions</p>
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-brand-purple text-white rounded-br-md'
                      : 'bg-bg-tertiary text-text-primary rounded-bl-md'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-bg-tertiary rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-text-tertiary" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your shows..."
                rows={1}
                className={cn(
                  'flex-1 resize-none rounded-xl border border-border',
                  'bg-bg-secondary px-4 py-2.5 text-sm text-text-primary',
                  'placeholder:text-text-tertiary',
                  'focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple',
                  'max-h-24'
                )}
                style={{ minHeight: '42px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  'p-2.5 rounded-xl transition-colors',
                  'bg-brand-purple text-white',
                  'hover:bg-purple-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

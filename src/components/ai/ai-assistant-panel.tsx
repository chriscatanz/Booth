'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sparkles, X, Send, Loader2, Copy, Check, ChevronDown,
  Zap, FileText, MessageSquare, RefreshCw, Wand2,
  FileUp, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as aiService from '@/services/ai-service';
import { useTradeShowStore } from '@/store/trade-show-store';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'content' | 'document' | 'chat';
  context?: {
    showName?: string;
    showLocation?: string;
    showDates?: string;
    leadName?: string;
    leadNotes?: string;
  };
}

type Tab = 'content' | 'document' | 'chat';

export function AIAssistantPanel({ isOpen, onClose, initialTab = 'content', context }: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    setHasApiKey(aiService.hasApiKey());
  }, [isOpen]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: 'Generate', icon: <Zap size={16} /> },
    { id: 'document', label: 'Analyze', icon: <FileText size={16} /> },
    { id: 'chat', label: 'Assistant', icon: <MessageSquare size={16} /> },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        
        {/* Panel */}
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-text-primary">AI Assistant</h2>
                <p className="text-xs text-text-tertiary">Powered by Claude</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'border-brand-purple text-brand-purple'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="h-[500px] overflow-hidden">
            {!hasApiKey ? (
              <NoApiKeyState />
            ) : (
              <>
                {activeTab === 'content' && <ContentGenerator context={context} />}
                {activeTab === 'document' && <DocumentAnalyzer />}
                {activeTab === 'chat' && <ShowAssistantChat context={context} />}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function NoApiKeyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
        <Sparkles size={32} className="text-warning" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">API Key Required</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        To use AI features, add your Claude API key in Settings → AI Assistant.
      </p>
      <Button variant="outline">
        Open Settings
      </Button>
    </div>
  );
}

// Content Generator Tab
function ContentGenerator({ context }: { context?: AIAssistantPanelProps['context'] }) {
  const [contentType, setContentType] = useState<aiService.ContentGenerationRequest['type']>('talking_points');
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const contentTypes: { id: aiService.ContentGenerationRequest['type']; label: string; description: string }[] = [
    { id: 'talking_points', label: 'Talking Points', description: 'Booth conversation starters' },
    { id: 'social_post', label: 'Social Posts', description: 'LinkedIn announcements' },
    { id: 'follow_up_email', label: 'Follow-up Email', description: 'Post-show lead outreach' },
    { id: 'post_show_report', label: 'Post-Show Report', description: 'Executive summary' },
    { id: 'checklist', label: 'Checklist', description: 'Packing & prep list' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult('');
    
    try {
      const content = await aiService.generateContent({
        type: contentType,
        context: {
          ...context,
          customPrompt,
        },
      });
      setResult(content);
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Generation failed'}`);
    }
    
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Type Selection */}
      <div className="p-4 border-b border-border space-y-3">
        <label className="block text-sm font-medium text-text-primary">What would you like to generate?</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {contentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setContentType(type.id)}
              className={cn(
                'p-3 rounded-lg border text-left transition-all',
                contentType === type.id
                  ? 'border-brand-purple bg-brand-purple/10'
                  : 'border-border hover:border-border-strong bg-bg-tertiary'
              )}
            >
              <p className="text-sm font-medium text-text-primary">{type.label}</p>
              <p className="text-xs text-text-tertiary">{type.description}</p>
            </button>
          ))}
        </div>
        
        {/* Custom Prompt */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Additional instructions (optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="E.g., Focus on AI capabilities, mention our new product launch..."
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-brand-purple"
            rows={2}
          />
        </div>
        
        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* Result */}
      <div className="flex-1 overflow-auto p-4">
        {result ? (
          <div className="relative">
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-bg-tertiary hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="p-1.5 rounded-lg bg-bg-tertiary hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
              >
                <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-text-primary bg-bg-tertiary p-4 rounded-lg overflow-auto">
                {result}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-tertiary">
            <Wand2 size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Select a content type and click Generate</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Document Analyzer Tab
function DocumentAnalyzer() {
  const [documentText, setDocumentText] = useState('');
  const [analysisType, setAnalysisType] = useState<aiService.DocumentAnalysisRequest['analysisType']>('extract_deadlines');
  const [customQuery, setCustomQuery] = useState('');
  const [result, setResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisTypes: { id: aiService.DocumentAnalysisRequest['analysisType']; label: string }[] = [
    { id: 'extract_deadlines', label: 'Extract Deadlines' },
    { id: 'extract_requirements', label: 'Extract Requirements' },
    { id: 'summarize', label: 'Summarize' },
    { id: 'custom', label: 'Ask a Question' },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, only handle text files. PDF would need a parser.
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text();
      setDocumentText(text);
    } else {
      // For other files, show a message
      setDocumentText('[PDF parsing coming soon - please paste the text content for now]');
    }
  };

  const handleAnalyze = async () => {
    if (!documentText.trim()) return;
    
    setIsAnalyzing(true);
    setResult('');
    
    try {
      const analysis = await aiService.analyzeDocument({
        documentText,
        analysisType,
        customQuery: analysisType === 'custom' ? customQuery : undefined,
      });
      setResult(analysis);
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Analysis failed'}`);
    }
    
    setIsAnalyzing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        {/* Document Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-text-primary">Document Content</label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-brand-purple hover:underline flex items-center gap-1"
              >
                <FileUp size={12} />
                Upload
              </button>
              {documentText && (
                <button
                  onClick={() => setDocumentText('')}
                  className="text-xs text-text-tertiary hover:text-error flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              )}
            </div>
          </div>
          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            placeholder="Paste exhibitor manual, contract, or other document text here..."
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-brand-purple"
            rows={4}
          />
        </div>

        {/* Analysis Type */}
        <div className="flex gap-2 flex-wrap">
          {analysisTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setAnalysisType(type.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                analysisType === type.id
                  ? 'bg-brand-purple text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Custom Query */}
        {analysisType === 'custom' && (
          <input
            type="text"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            placeholder="What would you like to know about this document?"
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
        )}

        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || !documentText.trim()}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText size={16} />
              Analyze Document
            </>
          )}
        </Button>
      </div>

      {/* Result */}
      <div className="flex-1 overflow-auto p-4">
        {result ? (
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-tertiary hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            <pre className="whitespace-pre-wrap text-sm text-text-primary bg-bg-tertiary p-4 rounded-lg overflow-auto">
              {result}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-tertiary">
            <FileText size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Paste or upload a document to analyze</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Show Assistant Chat Tab
function ShowAssistantChat({ context }: { context?: AIAssistantPanelProps['context'] }) {
  const { shows, selectedShow } = useTradeShowStore();
  const [messages, setMessages] = useState<aiService.ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: aiService.ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.chatWithAssistant({
        messages: [...messages, userMessage],
        showContext: {
          shows: shows.slice(0, 10).map(s => ({
            name: s.name,
            dates: `${s.startDate || 'TBD'} - ${s.endDate || 'TBD'}`,
            location: s.location || 'TBD',
            status: s.showStatus || 'Unknown',
            leads: s.totalLeads || undefined,
            cost: s.cost || undefined,
          })),
          currentShow: selectedShow ? ({ ...selectedShow } as Record<string, unknown>) : undefined,
        },
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages((prev) => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}` 
      }]);
    }

    setIsLoading(false);
  };

  const suggestions = [
    "What shows do I have coming up?",
    "Which show had the most leads last year?",
    "Help me prepare for my next show",
    "What's my total trade show spend?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 rounded-full bg-brand-purple/10 flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-brand-purple" />
            </div>
            <h3 className="font-medium text-text-primary mb-1">Show Assistant</h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm">
              Ask me anything about your trade shows. I can help with planning, analysis, and recommendations.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-3 py-1.5 rounded-full bg-bg-tertiary text-xs text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'max-w-[85%] p-3 rounded-xl',
                msg.role === 'user'
                  ? 'ml-auto bg-brand-purple text-white'
                  : 'bg-bg-tertiary text-text-primary'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </motion.div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-text-tertiary">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about your shows..."
            className="flex-1 px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

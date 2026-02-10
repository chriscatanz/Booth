'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Wand2, FileText, MessageSquare, Send, Loader2, 
  Copy, Check, RefreshCw, Upload, FileUp, Trash2, ChevronDown,
  Mail, ExternalLink, AlertCircle, Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import * as aiService from '@/services/ai-service';
import { useTradeShowStore } from '@/store/trade-show-store';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type Tab = 'generate' | 'documents' | 'chat';

interface AIViewProps {
  onOpenSettings?: () => void;
}

export default function AIView({ onOpenSettings }: AIViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('generate');
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const { organization } = useAuthStore();
  const { shows } = useTradeShowStore();

  // Load API key and check if configured
  useEffect(() => {
    async function loadKey() {
      if (organization?.id) {
        // Set org context for AI service
        aiService.setCurrentOrg(organization.id);
        
        // Load the API key from database
        await aiService.loadApiKeyFromOrg(supabase as any, organization.id);
        
        // Now check if it's configured
        setIsConfigured(aiService.hasApiKey());
      }
    }
    loadKey();
  }, [organization?.id]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'generate', label: 'Generate Content', icon: Wand2 },
    { id: 'documents', label: 'Extract from Documents', icon: FileText },
    { id: 'chat', label: 'Chat Assistant', icon: MessageSquare },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-purple-dark flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">AI Assistant</h1>
              <p className="text-sm text-text-secondary">Generate content, extract data, and get answers</p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {isConfigured === null ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-bg-tertiary text-text-secondary border border-border">
                <Loader2 size={12} className="animate-spin" />
                Checking...
              </div>
            ) : (
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
                isConfigured 
                  ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              )}>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  isConfigured ? 'bg-green-500' : 'bg-amber-500'
                )} />
                {isConfigured ? 'API Key Configured' : 'No API Key'}
              </div>
            )}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
              title="AI Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <GenerateTab shows={shows} />
            </motion.div>
          )}
          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <DocumentsTab />
            </motion.div>
          )}
          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full"
            >
              <ChatTab shows={shows} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============================================================================
// GENERATE TAB
// ============================================================================

function GenerateTab({ shows }: { shows: ReturnType<typeof useTradeShowStore>['shows'] }) {
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [contentType, setContentType] = useState<aiService.ContentGenerationRequest['type']>('talking_points');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  const selectedShow = shows.find(s => String(s.id) === selectedShowId);

  const contentTypes: { id: aiService.ContentGenerationRequest['type']; label: string; description: string; category: 'pre' | 'post' }[] = [
    { id: 'pre_show_outreach', label: 'Pre-Show Outreach', description: '3 emails for prospects, customers & partners', category: 'pre' },
    { id: 'talking_points', label: 'Talking Points', description: 'Booth conversation starters', category: 'pre' },
    { id: 'social_post', label: 'Social Posts', description: 'LinkedIn announcements', category: 'pre' },
    { id: 'checklist', label: 'Packing Checklist', description: 'Comprehensive prep list', category: 'pre' },
    { id: 'follow_up_email', label: 'Follow-up Email', description: 'Single personalized email', category: 'post' },
    { id: 'follow_up_sequence', label: 'Follow-up Sequence', description: '3-email nurture campaign', category: 'post' },
    { id: 'post_show_report', label: 'Post-Show Report', description: 'Executive summary', category: 'post' },
    { id: 'roi_analysis', label: 'ROI Analysis', description: 'Detailed performance breakdown', category: 'post' },
  ];

  const isEmailContent = ['follow_up_email', 'follow_up_sequence', 'pre_show_outreach'].includes(contentType);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult('');

    try {
      const showContext = selectedShow ? {
        showName: selectedShow.name,
        showLocation: selectedShow.location || undefined,
        showDates: selectedShow.startDate && selectedShow.endDate
          ? `${selectedShow.startDate} - ${selectedShow.endDate}`
          : undefined,
        boothSize: selectedShow.boothSize || undefined,
        boothNumber: selectedShow.boothNumber || undefined,
        costs: {
          boothCost: selectedShow.cost || 0,
          shippingCost: selectedShow.shippingCost || 0,
          electricalCost: selectedShow.electricalCost || 0,
          laborCost: selectedShow.laborCost || 0,
          internetCost: selectedShow.internetCost || 0,
          servicesCost: selectedShow.standardServicesCost || 0,
          hotelCostPerNight: selectedShow.hotelCostPerNight || 0,
        },
        metrics: {
          totalLeads: selectedShow.totalLeads || 0,
          qualifiedLeads: selectedShow.qualifiedLeads || 0,
          meetingsBooked: selectedShow.meetingsBooked || 0,
          dealsWon: selectedShow.dealsWon || 0,
          revenueAttributed: selectedShow.revenueAttributed || 0,
          totalAttending: selectedShow.totalAttending || 0,
        },
      } : {};

      const content = await aiService.generateContent({
        type: contentType,
        context: {
          ...showContext,
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

  const parseEmailFromResult = (emailContent: string): { subject: string; body: string } => {
    const subjectMatch = emailContent.match(/(?:##\s*(?:Email\s*\d+:?\s*)?|Subject:\s*|\*\*Subject:\*\*\s*)([^\n]+)/i);
    const subject = subjectMatch ? subjectMatch[1].replace(/\*\*/g, '').trim() : 'Follow-up from our conversation';
    
    let body = emailContent
      .replace(/^##\s*.+$/gm, '')
      .replace(/\*\*Send:\s*Day\s*\d+\*\*/gi, '')
      .replace(/---/g, '')
      .replace(/\*\*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return { subject, body };
  };

  const handleOpenInEmail = () => {
    const parsed = parseEmailFromResult(result);
    const mailto = `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(parsed.subject)}&body=${encodeURIComponent(parsed.body)}`;
    window.open(mailto, '_blank');
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Controls */}
      <div className="w-80 border-r border-border p-4 space-y-4 overflow-auto">
        {/* Show Selector */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Select a Show (optional)</label>
          <select
            value={selectedShowId}
            onChange={(e) => setSelectedShowId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary"
          >
            <option value="">General (no show context)</option>
            {shows.map((show) => (
              <option key={show.id} value={String(show.id)}>
                {show.name}
              </option>
            ))}
          </select>
          {selectedShow && (
            <p className="text-xs text-text-tertiary mt-1">
              {selectedShow.location} • {selectedShow.startDate}
            </p>
          )}
        </div>

        {/* Additional Instructions */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Additional instructions (optional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="E.g., Focus on AI capabilities, mention our new product launch..."
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary resize-none"
            rows={2}
          />
        </div>

        {/* Content Type Selection */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Content Type</label>
          
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Pre-Show</p>
          <div className="space-y-1 mb-3">
            {contentTypes.filter(t => t.category === 'pre').map((type) => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                className={cn(
                  'w-full p-2 rounded-lg border text-left transition-all',
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

          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-2">Post-Show</p>
          <div className="space-y-1">
            {contentTypes.filter(t => t.category === 'post').map((type) => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                className={cn(
                  'w-full p-2 rounded-lg border text-left transition-all',
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
        </div>

        {/* Generate Button */}
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

      {/* Right Panel - Result */}
      <div className="flex-1 p-4 flex flex-col">
        {result ? (
          <>
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-primary">Generated Content</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-bg-tertiary hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
                {isEmailContent && (
                  <button
                    onClick={() => setShowEmailInput(!showEmailInput)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      showEmailInput
                        ? "bg-brand-purple text-white"
                        : "bg-bg-tertiary hover:bg-surface text-text-tertiary hover:text-text-primary"
                    )}
                    title="Open in email client"
                  >
                    <Mail size={16} />
                  </button>
                )}
                <Button size="sm" variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Email Input */}
            <AnimatePresence>
              {showEmailInput && isEmailContent && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg">
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="recipient@email.com"
                      className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary"
                    />
                    <Button
                      size="sm"
                      onClick={handleOpenInEmail}
                      disabled={!recipientEmail.includes('@')}
                    >
                      <ExternalLink size={14} />
                      Open in Mail
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result Content */}
            <div className="flex-1 bg-bg-tertiary rounded-lg p-4 overflow-auto">
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {result.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return <h3 key={i} className="text-base font-semibold text-text-primary mt-4 mb-2">{line.replace('## ', '')}</h3>;
                    }
                    if (line.startsWith('### ')) {
                      return <h4 key={i} className="text-sm font-semibold text-text-primary mt-3 mb-1">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-semibold text-text-primary">{line.replace(/\*\*/g, '')}</p>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4">{line.replace('- ', '')}</li>;
                    }
                    if (line.trim() === '---') {
                      return <hr key={i} className="my-4 border-border" />;
                    }
                    return <p key={i}>{line || '\u00A0'}</p>;
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                <Wand2 size={32} className="text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Generate Content</h3>
              <p className="text-sm text-text-secondary max-w-sm">
                Select a content type and click Generate to create AI-powered content for your trade shows.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DOCUMENTS TAB
// ============================================================================

function DocumentsTab() {
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setError(null);
    setFileName(file.name);

    const isTextFile = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md');

    if (isTextFile) {
      const text = await file.text();
      setDocumentText(text);
      return;
    }

    const supportedTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/rtf', 'application/rtf'];
    const supportedExts = ['.pdf', '.doc', '.docx', '.rtf'];

    const isSupported = supportedTypes.includes(file.type) ||
      supportedExts.some(ext => file.name.toLowerCase().endsWith(ext));

    if (isSupported) {
      try {
        const formData = new FormData();
        formData.append('files', file);

        const { data: { session } } = await supabase.auth.getSession();
        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch('/api/documents/parse', {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to parse document');
        }

        const data = await response.json();
        setDocumentText(data.text || '');
      } catch (err) {
        setError('Failed to parse document. Try a different file format.');
        setFileName(null);
      }
    } else {
      setError('Unsupported file type. Try PDF, DOC, DOCX, or TXT.');
      setFileName(null);
    }
  };

  const handleExtract = async () => {
    if (!documentText) return;

    setIsExtracting(true);
    setError(null);

    try {
      const result = await aiService.extractShowFromDocument(documentText);
      setExtractedData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    }

    setIsExtracting(false);
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Upload */}
      <div className="w-80 border-r border-border p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-2">Upload Document</h3>
          <p className="text-xs text-text-secondary mb-4">
            Upload a vendor packet, exhibitor guide, or contract and let AI extract show details.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-purple/50 hover:bg-bg-tertiary transition-all"
        >
          <Upload size={32} className="mx-auto mb-2 text-text-tertiary" />
          <p className="text-sm font-medium text-text-primary mb-1">
            {fileName || 'Click to upload'}
          </p>
          <p className="text-xs text-text-tertiary">
            PDF, DOC, DOCX, or TXT
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 text-error text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {documentText && (
          <>
            <div className="p-3 bg-bg-tertiary rounded-lg">
              <p className="text-xs text-text-secondary mb-1">Document loaded</p>
              <p className="text-sm text-text-primary font-medium truncate">{fileName}</p>
              <p className="text-xs text-text-tertiary">{documentText.length.toLocaleString()} characters</p>
            </div>

            <Button onClick={handleExtract} disabled={isExtracting} className="w-full">
              {isExtracting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Extract Show Details
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 p-4 flex flex-col">
        {extractedData ? (
          <div className="flex-1 overflow-auto">
            <h3 className="text-sm font-medium text-text-primary mb-3">Extracted Details</h3>
            <div className="bg-bg-tertiary rounded-lg p-4">
              <pre className="text-sm text-text-primary whitespace-pre-wrap">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Extract from Documents</h3>
              <p className="text-sm text-text-secondary max-w-sm">
                Upload a vendor packet or exhibitor guide to automatically extract show details like dates, booth info, and deadlines.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CHAT TAB
// ============================================================================

function ChatTab({ shows }: { shows: ReturnType<typeof useTradeShowStore>['shows'] }) {
  const [messages, setMessages] = useState<aiService.ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: aiService.ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const showContext = {
        shows: shows.map(s => ({
          name: s.name,
          dates: s.startDate && s.endDate ? `${s.startDate} - ${s.endDate}` : 'TBD',
          location: s.location || 'TBD',
          status: s.showStatus || 'Planning',
          boothNumber: s.boothNumber || undefined,
          boothSize: s.boothSize || undefined,
          cost: s.cost || undefined,
          shippingCutoff: s.shippingCutoff || undefined,
          hotelName: s.hotelName || undefined,
          hotelConfirmed: s.hotelConfirmed || undefined,
          registrationConfirmed: s.registrationConfirmed || undefined,
          totalLeads: s.totalLeads || undefined,
          qualifiedLeads: s.qualifiedLeads || undefined,
        })),
      };

      const response = await aiService.chatWithAssistant({
        messages: [...messages, userMessage],
        showContext,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Failed to get response'}` }]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Chat with AI</h3>
              <p className="text-sm text-text-secondary mb-4">
                Ask questions about your trade shows. The assistant has access to all your show data.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "What's my total spend this quarter?",
                  "Which shows are missing hotel confirmations?",
                  "List my upcoming shows",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-3 py-1.5 text-xs bg-bg-tertiary hover:bg-surface text-text-secondary rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2',
                  msg.role === 'user'
                    ? 'bg-brand-purple text-white'
                    : 'bg-bg-tertiary text-text-primary'
                )}
              >
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-bg-tertiary rounded-2xl px-4 py-3">
              <Loader2 size={16} className="animate-spin text-text-tertiary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your trade shows..."
            className="flex-1 px-4 py-3 rounded-xl bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-brand-purple"
            rows={1}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

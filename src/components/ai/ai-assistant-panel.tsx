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
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
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

export function AIAssistantPanel({ isOpen, onClose, onOpenSettings, initialTab = 'content', context }: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [sharedDocuments, setSharedDocuments] = useState<string>('');
  const organization = useAuthStore((s) => s.organization);

  useEffect(() => {
    // Set org context and load API key status when panel opens
    async function loadKeyStatus() {
      if (!organization?.id || !isOpen) return;
      
      aiService.setCurrentOrg(organization.id);
      
      // If key not already loaded, fetch from database
      if (!aiService.isKeyLoadedFromDb()) {
        setIsLoadingKey(true);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await aiService.loadApiKeyFromOrg(supabase as any, organization.id);
        } catch (e) {
          console.error('Failed to load AI key status:', e);
        }
        setIsLoadingKey(false);
      }
      
      setHasApiKey(aiService.hasApiKey());
    }
    
    loadKeyStatus();
  }, [isOpen, organization?.id]);

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
          className="relative w-full max-w-4xl max-h-[85vh] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
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
              <NoApiKeyState onOpenSettings={() => { onClose(); onOpenSettings?.(); }} />
            ) : (
              <>
                {activeTab === 'content' && <ContentGenerator context={context} />}
                {activeTab === 'document' && <DocumentAnalyzer onDocumentsChange={setSharedDocuments} />}
                {activeTab === 'chat' && <ShowAssistantChat context={context} uploadedDocuments={sharedDocuments} />}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function NoApiKeyState({ onOpenSettings }: { onOpenSettings?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mb-4">
        <Sparkles size={32} className="text-warning" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">API Key Required</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        To use AI features, add your Claude API key in Settings → AI Assistant.
      </p>
      <Button variant="outline" onClick={onOpenSettings}>
        Open Settings
      </Button>
    </div>
  );
}

// Content Generator Tab
function ContentGenerator({ context }: { context?: AIAssistantPanelProps['context'] }) {
  const { shows } = useTradeShowStore();
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [contentType, setContentType] = useState<aiService.ContentGenerationRequest['type']>('talking_points');
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Get selected show data
  const selectedShow = shows.find(s => s.id === selectedShowId);

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
      // Build context from selected show or passed context
      const showContext = selectedShow ? {
        showName: selectedShow.name,
        showLocation: selectedShow.location || undefined,
        showDates: selectedShow.startDate && selectedShow.endDate 
          ? `${selectedShow.startDate} - ${selectedShow.endDate}` 
          : undefined,
        boothSize: selectedShow.boothSize || undefined,
        boothNumber: selectedShow.boothNumber || undefined,
      } : context;

      const content = await aiService.generateContent({
        type: contentType,
        context: {
          ...showContext,
          customPrompt,
        },
      });
      setResult(content);
      setIsExpanded(true); // Auto-expand when content is generated
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
      {/* Controls Section - collapses when result is expanded */}
      <div className={cn(
        "border-b border-border space-y-3 transition-all",
        isExpanded && result ? "p-2" : "p-4"
      )}>
        {/* Show Selector */}
        <div className={cn(isExpanded && result && "hidden")}>
          <label className="block text-sm font-medium text-text-primary mb-2">Select a show (optional)</label>
          <select
            value={selectedShowId}
            onChange={(e) => setSelectedShowId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary focus:outline-none focus:border-brand-purple"
          >
            <option value="">General content (no specific show)</option>
            {shows.map((show) => (
              <option key={show.id} value={show.id}>
                {show.name} {show.location ? `— ${show.location}` : ''} {show.startDate ? `(${show.startDate})` : ''}
              </option>
            ))}
          </select>
          {selectedShow && (
            <p className="text-xs text-text-tertiary mt-1">
              {[selectedShow.boothSize, selectedShow.boothNumber ? `Booth ${selectedShow.boothNumber}` : null].filter(Boolean).join(' • ') || 'Show selected'}
            </p>
          )}
        </div>

        {/* Content Type Selection */}
        <div className={cn(isExpanded && result && "hidden")}>
          <label className="block text-sm font-medium text-text-primary mb-2">What would you like to generate?</label>
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
        </div>
        
        {/* Custom Prompt */}
        <div className={cn(isExpanded && result && "hidden")}>
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
        
        {/* Generate Button / Collapsed Header */}
        {isExpanded && result ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary"
            >
              <ChevronDown size={16} className="rotate-180" />
              <span>Show options</span>
              {selectedShow && <span className="text-text-tertiary">• {selectedShow.name}</span>}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-bg-tertiary hover:bg-surface text-text-tertiary hover:text-text-primary transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <Button size="sm" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Regenerate
              </Button>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Result - expands to fill available space */}
      <div className={cn(
        "flex-1 overflow-auto p-4",
        isExpanded && result && "p-3"
      )}>
        {result ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 prose prose-sm prose-invert max-w-none bg-bg-tertiary p-4 rounded-lg overflow-auto">
              <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {result.split('\n').map((line, i) => {
                  // Basic markdown-ish rendering
                  if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mt-4 mb-2 text-text-primary">{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold mt-3 mb-2 text-text-primary">{line.slice(3)}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold mt-2 mb-1 text-text-primary">{line.slice(4)}</h3>;
                  if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-4 list-disc text-text-primary">{line.slice(2)}</li>;
                  if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 list-decimal text-text-primary">{line.replace(/^\d+\.\s/, '')}</li>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-text-primary">{line.slice(2, -2)}</p>;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} className="text-text-primary mb-1">{line}</p>;
                })}
              </div>
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
interface UploadedFile {
  name: string;
  text: string;
  error?: string;
  isLoading?: boolean;
}

interface AnalysisProgress {
  current: number;
  total: number;
  stage: string;
}

function DocumentAnalyzer({ onDocumentsChange }: { onDocumentsChange?: (docs: string) => void }) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [documentText, setDocumentText] = useState('');
  const [analysisType, setAnalysisType] = useState<aiService.DocumentAnalysisRequest['analysisType']>('extract_deadlines');
  const [customQuery, setCustomQuery] = useState('');
  const [result, setResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisTypes: { id: aiService.DocumentAnalysisRequest['analysisType']; label: string }[] = [
    { id: 'extract_deadlines', label: 'Extract Deadlines' },
    { id: 'extract_requirements', label: 'Extract Requirements' },
    { id: 'summarize', label: 'Summarize' },
    { id: 'custom', label: 'Ask a Question' },
  ];

  const supportedExtensions = '.pdf,.doc,.docx,.txt,.rtf,.md';

  // Combine uploaded file texts for analysis
  useEffect(() => {
    const combinedText = uploadedFiles
      .filter(f => f.text && !f.error)
      .map(f => `--- ${f.name} ---\n${f.text}`)
      .join('\n\n');
    setDocumentText(combinedText);
    // Share documents with chat tab
    onDocumentsChange?.(combinedText);
  }, [uploadedFiles, onDocumentsChange]);

  const parseFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Add files to state with loading status
    const newFiles: UploadedFile[] = files.map(f => ({
      name: f.name,
      text: '',
      isLoading: true,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));

      // Get auth token for API request
      const { data: { session } } = await supabase.auth.getSession();
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/documents/parse', {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to parse files');
      }

      const data = await response.json();
      
      // Update files with parsed content
      setUploadedFiles(prev => {
        const updated = [...prev];
        data.documents.forEach((doc: { filename: string; text: string; error?: string }) => {
          const idx = updated.findIndex(f => f.name === doc.filename && f.isLoading);
          if (idx !== -1) {
            updated[idx] = {
              name: doc.filename,
              text: doc.text,
              error: doc.error,
              isLoading: false,
            };
          }
        });
        return updated;
      });
    } catch (err) {
      // Mark all new files as failed
      setUploadedFiles(prev => prev.map(f => 
        f.isLoading ? { ...f, isLoading: false, error: err instanceof Error ? err.message : 'Parse failed' } : f
      ));
    }

    setIsUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await parseFiles(files);
    // Reset input so same file can be uploaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    await parseFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setDocumentText('');
  };

  const handleAnalyze = async () => {
    if (!documentText.trim()) return;
    
    setIsAnalyzing(true);
    setResult('');
    setProgress(null);
    
    // Check if this is a large document that will be chunked
    const isLargeDoc = documentText.length > 40000;
    
    try {
      const analysis = await aiService.analyzeDocument({
        documentText,
        analysisType,
        customQuery: analysisType === 'custom' ? customQuery : undefined,
        onProgress: isLargeDoc ? (p) => setProgress(p) : undefined,
      });
      setResult(analysis);
    } catch (err) {
      setResult(`Error: ${err instanceof Error ? err.message : 'Analysis failed'}`);
    }
    
    setIsAnalyzing(false);
    setProgress(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (ext === 'doc' || ext === 'docx') return '📝';
    if (ext === 'rtf') return '📃';
    return '📋';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-3">
        {/* Drop Zone & File List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-primary">Documents</label>
            {uploadedFiles.length > 0 && (
              <button
                onClick={clearAllFiles}
                className="text-xs text-text-tertiary hover:text-error flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear All
              </button>
            )}
          </div>
          
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all',
              isDragging
                ? 'border-brand-purple bg-brand-purple/10'
                : 'border-border hover:border-brand-purple/50 bg-bg-tertiary'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={supportedExtensions}
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <FileUp size={24} className={cn('mx-auto mb-2', isDragging ? 'text-brand-purple' : 'text-text-tertiary')} />
            <p className="text-sm text-text-secondary">
              {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              PDF, DOCX, DOC, TXT, RTF, MD (max 20MB each)
            </p>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-2 max-h-32 overflow-auto">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className={cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-sm',
                    file.error ? 'bg-error/10 text-error' : 'bg-bg-tertiary text-text-primary'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{getFileIcon(file.name)}</span>
                    <span className="truncate">{file.name}</span>
                    {file.isLoading && <Loader2 size={14} className="animate-spin text-brand-purple" />}
                    {file.error && <span className="text-xs text-error">({file.error})</span>}
                    {file.text && !file.error && (
                      <span className="text-xs text-text-tertiary">
                        ({(file.text.length / 1000).toFixed(1)}k chars)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-1 hover:bg-surface rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Text Input (collapsible) */}
        {uploadedFiles.length === 0 && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Or paste text directly
            </label>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Paste exhibitor manual, contract, or other document text here..."
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:border-brand-purple"
              rows={3}
            />
          </div>
        )}

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
            placeholder="What would you like to know about these documents?"
            className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple"
          />
        )}

        {/* Large document indicator */}
        {documentText.length > 40000 && !isAnalyzing && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-purple/10 text-brand-purple text-xs">
            <Sparkles size={14} />
            <span>Large document detected ({(documentText.length / 1000).toFixed(0)}k chars) — will process in sections for better accuracy</span>
          </div>
        )}

        {/* Progress bar for chunked processing */}
        {progress && progress.total > 1 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>{progress.stage}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-brand-purple"
                initial={{ width: 0 }}
                animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing || isUploading || !documentText.trim()}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {progress ? progress.stage : 'Analyzing...'}
            </>
          ) : isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing files...
            </>
          ) : (
            <>
              <FileText size={16} />
              Analyze {uploadedFiles.length > 1 ? `${uploadedFiles.length} Documents` : 'Document'}
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
            <div className="prose prose-sm prose-invert max-w-none bg-bg-tertiary p-4 rounded-lg overflow-auto max-h-[50vh]">
              <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {result.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mt-4 mb-2 text-text-primary">{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold mt-3 mb-2 text-text-primary">{line.slice(3)}</h2>;
                  if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold mt-2 mb-1 text-text-primary">{line.slice(4)}</h3>;
                  if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-4 list-disc text-text-primary">{line.slice(2)}</li>;
                  if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 list-decimal text-text-primary">{line.replace(/^\d+\.\s/, '')}</li>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-text-primary">{line.slice(2, -2)}</p>;
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} className="text-text-primary mb-1">{line}</p>;
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-text-tertiary">
            <FileText size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Upload or paste documents to analyze</p>
            <p className="text-xs mt-1 opacity-75">Supports PDF, Word, RTF, TXT, and Markdown</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Show Assistant Chat Tab
function ShowAssistantChat({ context, uploadedDocuments }: { 
  context?: AIAssistantPanelProps['context'];
  uploadedDocuments?: string;
}) {
  const { shows, selectedShow, allAttendees } = useTradeShowStore();
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
      // Build attendee context for ALL shows (grouped by show)
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

      // Pass full show objects directly - they already have all the data
      const response = await aiService.chatWithAssistant({
        messages: [...messages, userMessage],
        showContext: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shows: shows as any, // Pass raw shows - they have all fields
          currentShow: selectedShow ? ({ ...selectedShow } as Record<string, unknown>) : undefined,
          attendeesByShow: Object.keys(attendeesByShow).length > 0 ? attendeesByShow : undefined,
          uploadedDocuments: uploadedDocuments || undefined,
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

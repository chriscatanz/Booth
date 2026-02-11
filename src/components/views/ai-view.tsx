'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Wand2, FileText, MessageSquare, Send, Loader2, 
  Copy, Check, RefreshCw, Upload, FileUp, Trash2, ChevronDown,
  Mail, ExternalLink, AlertCircle, Settings, Calendar, MapPin,
  DollarSign, Building, Clock, CheckSquare, Users, Package
} from 'lucide-react';
import * as taskService from '@/services/task-service';
import { useToastStore } from '@/store/toast-store';
import { cn } from '@/lib/utils';
import * as aiService from '@/services/ai-service';
import { useTradeShowStore } from '@/store/trade-show-store';
import { TradeShow } from '@/types';
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

function GenerateTab({ shows }: { shows: TradeShow[] }) {
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
// DOCUMENTS TAB - Extract show details and create tasks from vendor packets
// ============================================================================

interface ExtractedDeadline {
  name: string;
  date: string;
  description?: string;
}

interface ExtractedShowData {
  showName?: string;
  dates?: { start?: string; end?: string };
  location?: { venue?: string; city?: string; state?: string; country?: string };
  booth?: { number?: string; size?: string; type?: string };
  costs?: { boothRental?: number; sponsorship?: number; additionalFees?: string[] };
  deadlines?: ExtractedDeadline[];
  contacts?: { name?: string; role?: string; email?: string; phone?: string }[];
  logistics?: { setupDate?: string; teardownDate?: string; shippingDeadline?: string; shippingAddress?: string };
  notes?: string;
}

function DocumentsTab() {
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedShowData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { selectedShow, updateSelectedShow, saveShow } = useTradeShowStore();
  const { organization, user } = useAuthStore();
  const toast = useToastStore();

  const handleFileUpload = async (file: File) => {
    setError(null);
    setSuccessMessage(null);
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
    setSuccessMessage(null);

    try {
      const result = await aiService.extractShowFromDocument(documentText);
      setExtractedData(result as ExtractedShowData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    }

    setIsExtracting(false);
  };

  const handleApplyToShow = async () => {
    if (!extractedData || !selectedShow) {
      toast.error('Please select a show first');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const updates: Record<string, unknown> = {};
      
      // Map extracted data to show fields
      if (extractedData.showName) updates.name = extractedData.showName;
      if (extractedData.dates?.start) updates.startDate = extractedData.dates.start;
      if (extractedData.dates?.end) updates.endDate = extractedData.dates.end;
      
      // Build location string
      const loc = extractedData.location;
      if (loc) {
        const locationParts = [loc.city, loc.state].filter(Boolean);
        if (locationParts.length > 0) updates.location = locationParts.join(', ');
      }
      
      // Booth info
      if (extractedData.booth?.number) updates.boothNumber = extractedData.booth.number;
      if (extractedData.booth?.size) updates.boothSize = extractedData.booth.size;
      
      // Costs
      if (extractedData.costs?.boothRental) updates.cost = extractedData.costs.boothRental;
      
      // Logistics
      if (extractedData.logistics?.shippingDeadline) updates.shippingCutoff = extractedData.logistics.shippingDeadline;
      if (extractedData.logistics?.shippingAddress) updates.shippingInfo = extractedData.logistics.shippingAddress;
      
      // Contacts (first one)
      const contact = extractedData.contacts?.[0];
      if (contact?.name) updates.showContactName = contact.name;
      if (contact?.email) updates.showContactEmail = contact.email;
      
      // Notes
      if (extractedData.notes) {
        const existingNotes = selectedShow.generalNotes || '';
        updates.generalNotes = existingNotes 
          ? `${existingNotes}\n\n--- Extracted Notes ---\n${extractedData.notes}`
          : extractedData.notes;
      }

      // Apply updates
      updateSelectedShow(updates);
      await saveShow();
      
      setSuccessMessage('Show fields updated successfully!');
      toast.success('Show fields updated from document');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply data');
      toast.error('Failed to update show');
    }

    setIsApplying(false);
  };

  const handleCreateTasks = async () => {
    if (!extractedData?.deadlines?.length) {
      toast.error('No deadlines found to create tasks');
      return;
    }
    if (!organization?.id || !user?.id) {
      toast.error('Organization or user not found');
      return;
    }

    setIsCreatingTasks(true);
    setError(null);

    try {
      let created = 0;
      
      for (const deadline of extractedData.deadlines) {
        if (!deadline.name || !deadline.date) continue;
        
        await taskService.createTask(organization.id, user.id, {
          title: deadline.name,
          description: deadline.description || `Deadline extracted from: ${fileName}`,
          tradeShowId: selectedShow?.id || undefined,
          dueDate: deadline.date,
          priority: 'high',
        });
        created++;
      }
      
      // Also create tasks from logistics deadlines
      if (extractedData.logistics?.shippingDeadline) {
        await taskService.createTask(organization.id, user.id, {
          title: 'Shipping Deadline',
          description: `Ship materials by this date. Extracted from: ${fileName}`,
          tradeShowId: selectedShow?.id || undefined,
          dueDate: extractedData.logistics.shippingDeadline,
          priority: 'high',
        });
        created++;
      }
      
      setSuccessMessage(`Created ${created} tasks from deadlines!`);
      toast.success(`Created ${created} tasks`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
      toast.error('Failed to create tasks');
    }

    setIsCreatingTasks(false);
  };

  const handleApplyAll = async () => {
    await handleApplyToShow();
    if (extractedData?.deadlines?.length) {
      await handleCreateTasks();
    }
  };

  const deadlineCount = (extractedData?.deadlines?.length || 0) + 
    (extractedData?.logistics?.shippingDeadline ? 1 : 0);

  return (
    <div className="h-full flex">
      {/* Left Panel - Upload */}
      <div className="w-80 border-r border-border p-4 space-y-4 overflow-y-auto">
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-2">Upload Document</h3>
          <p className="text-xs text-text-secondary mb-4">
            Upload a vendor packet, exhibitor guide, or contract and let AI extract show details and deadlines.
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

        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
            <Check size={16} />
            {successMessage}
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

        {/* Action Buttons */}
        {extractedData && (
          <div className="space-y-2 pt-4 border-t border-border">
            <Button 
              onClick={handleApplyAll} 
              disabled={isApplying || isCreatingTasks || !selectedShow}
              className="w-full"
              variant="primary"
            >
              {(isApplying || isCreatingTasks) ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Apply All to Show
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleApplyToShow} 
                disabled={isApplying || !selectedShow}
                variant="outline"
                size="sm"
              >
                <Package size={14} />
                Fields
              </Button>
              <Button 
                onClick={handleCreateTasks} 
                disabled={isCreatingTasks || deadlineCount === 0}
                variant="outline"
                size="sm"
              >
                <CheckSquare size={14} />
                Tasks ({deadlineCount})
              </Button>
            </div>
            
            {!selectedShow && (
              <p className="text-xs text-warning text-center">
                Select a show first to apply extracted data
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        {extractedData ? (
          <div className="flex-1 overflow-y-auto space-y-4">
            <h3 className="text-sm font-medium text-text-primary sticky top-0 bg-background py-2">
              Extracted Details
            </h3>
            
            {/* Show Info */}
            {extractedData.showName && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-brand-purple" />
                  <span className="text-sm font-medium text-text-primary">Show Info</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-text-secondary">Name:</span> <span className="text-text-primary font-medium">{extractedData.showName}</span></p>
                  {extractedData.dates?.start && (
                    <p><span className="text-text-secondary">Dates:</span> <span className="text-text-primary">{extractedData.dates.start} — {extractedData.dates.end || 'TBD'}</span></p>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {extractedData.location && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-brand-cyan" />
                  <span className="text-sm font-medium text-text-primary">Location</span>
                </div>
                <div className="space-y-1 text-sm">
                  {extractedData.location.venue && <p className="text-text-primary">{extractedData.location.venue}</p>}
                  <p className="text-text-secondary">
                    {[extractedData.location.city, extractedData.location.state, extractedData.location.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Booth */}
            {extractedData.booth && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Building size={16} className="text-success" />
                  <span className="text-sm font-medium text-text-primary">Booth</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {extractedData.booth.number && <p><span className="text-text-secondary">Number:</span> <span className="text-text-primary">{extractedData.booth.number}</span></p>}
                  {extractedData.booth.size && <p><span className="text-text-secondary">Size:</span> <span className="text-text-primary">{extractedData.booth.size}</span></p>}
                  {extractedData.booth.type && <p><span className="text-text-secondary">Type:</span> <span className="text-text-primary">{extractedData.booth.type}</span></p>}
                </div>
              </div>
            )}

            {/* Costs */}
            {extractedData.costs && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-warning" />
                  <span className="text-sm font-medium text-text-primary">Costs</span>
                </div>
                <div className="space-y-1 text-sm">
                  {extractedData.costs.boothRental && <p><span className="text-text-secondary">Booth Rental:</span> <span className="text-text-primary font-medium">${extractedData.costs.boothRental.toLocaleString()}</span></p>}
                  {extractedData.costs.sponsorship && <p><span className="text-text-secondary">Sponsorship:</span> <span className="text-text-primary">${extractedData.costs.sponsorship.toLocaleString()}</span></p>}
                </div>
              </div>
            )}

            {/* Deadlines - Most Important! */}
            {(extractedData.deadlines?.length || extractedData.logistics?.shippingDeadline) && (
              <div className="p-4 bg-brand-purple/10 border border-brand-purple/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-brand-purple" />
                  <span className="text-sm font-medium text-text-primary">Deadlines</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-brand-purple text-white">
                    {deadlineCount} found
                  </span>
                </div>
                <div className="space-y-2">
                  {extractedData.deadlines?.map((d, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <CheckSquare size={14} className="text-brand-purple mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">{d.name}</p>
                        <p className="text-xs text-text-secondary">{d.date}</p>
                        {d.description && <p className="text-xs text-text-tertiary mt-1">{d.description}</p>}
                      </div>
                    </div>
                  ))}
                  {extractedData.logistics?.shippingDeadline && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <Package size={14} className="text-brand-purple mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Shipping Deadline</p>
                        <p className="text-xs text-text-secondary">{extractedData.logistics.shippingDeadline}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contacts */}
            {extractedData.contacts?.length && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-text-tertiary" />
                  <span className="text-sm font-medium text-text-primary">Contacts</span>
                </div>
                <div className="space-y-2">
                  {extractedData.contacts.map((c, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-text-primary font-medium">{c.name}</p>
                      {c.role && <p className="text-text-secondary text-xs">{c.role}</p>}
                      {c.email && <p className="text-text-tertiary text-xs">{c.email}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {extractedData.notes && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-text-tertiary" />
                  <span className="text-sm font-medium text-text-primary">Notes</span>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap">{extractedData.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-text-tertiary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Extract from Documents</h3>
              <p className="text-sm text-text-secondary max-w-sm">
                Upload a vendor packet or exhibitor guide to automatically extract show details and create tasks from deadlines.
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

function ChatTab({ shows }: { shows: TradeShow[] }) {
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

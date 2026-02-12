'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Wand2, FileText, MessageSquare, Send, Loader2, 
  Copy, Check, RefreshCw, Upload,
  Mail, ExternalLink, AlertCircle, Calendar, MapPin,
  DollarSign, Building, Clock, CheckSquare, Users, Package, Plus
} from 'lucide-react';
import * as taskService from '@/services/task-service';
import * as cacheService from '@/services/cache-service';
import { cn } from '@/lib/utils';
import * as aiService from '@/services/ai-service';
import { useTradeShowStore } from '@/store/trade-show-store';
import { TradeShow } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { useToastStore } from '@/store/toast-store';
import { supabase } from '@/lib/supabase';

type Tab = 'generate' | 'documents' | 'chat';

export default function AIView() {
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
        await aiService.loadApiKeyFromOrg(supabase as unknown as Parameters<typeof aiService.loadApiKeyFromOrg>[0], organization.id);
        
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
    
    const body = emailContent
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

// Use the comprehensive ExtractedShowData from ai-service
type ExtractedShowData = aiService.ExtractedShowData;

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
  const [targetShowId, setTargetShowId] = useState<string>('');
  
  const { shows, loadShows } = useTradeShowStore();
  
  // Use local selection instead of global selectedShow to avoid navigation
  const selectedShow = shows.find(s => String(s.id) === targetShowId) || null;
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
        // API returns { documents: [{ filename, text }] }
        const extractedText = data.documents?.[0]?.text || data.text || '';
        if (!extractedText) {
          throw new Error('Could not extract text from document');
        }
        setDocumentText(extractedText);
      } catch {
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

  const handleCreateNewShow = async () => {
    if (!extractedData) return;
    if (!organization?.id) {
      toast.error('Organization not found');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      // Build the new show data from all extracted fields
      const newShowData: Record<string, unknown> = {
        organization_id: organization.id,
        name: extractedData.name || `New Show from ${fileName}`,
      };

      // Basic Info
      if (extractedData.startDate) newShowData.start_date = extractedData.startDate;
      if (extractedData.endDate) newShowData.end_date = extractedData.endDate;
      if (extractedData.location) newShowData.location = extractedData.location;
      if (extractedData.boothNumber) newShowData.booth_number = extractedData.boothNumber;
      if (extractedData.boothSize) newShowData.booth_size = extractedData.boothSize;
      if (extractedData.cost) newShowData.cost = extractedData.cost;
      if (extractedData.attendeesIncluded) newShowData.attendees_included = extractedData.attendeesIncluded;
      if (extractedData.managementCompany) newShowData.management_company = extractedData.managementCompany;
      
      // Event Type & Virtual
      if (extractedData.eventType) newShowData.event_type = extractedData.eventType;
      if (extractedData.virtualPlatform) newShowData.virtual_platform = extractedData.virtualPlatform;
      if (extractedData.virtualPlatformUrl) newShowData.virtual_platform_url = extractedData.virtualPlatformUrl;
      if (extractedData.virtualBoothUrl) newShowData.virtual_booth_url = extractedData.virtualBoothUrl;
      
      // Venue
      if (extractedData.venueName) newShowData.venue_name = extractedData.venueName;
      if (extractedData.venueAddress) newShowData.venue_address = extractedData.venueAddress;
      
      // Move-in/Move-out
      if (extractedData.moveInDate) newShowData.move_in_date = extractedData.moveInDate;
      if (extractedData.moveInTime) newShowData.move_in_time = extractedData.moveInTime;
      if (extractedData.moveOutDate) newShowData.move_out_date = extractedData.moveOutDate;
      if (extractedData.moveOutTime) newShowData.move_out_time = extractedData.moveOutTime;
      
      // Shipping & Logistics
      if (extractedData.shippingDeadline) newShowData.shipping_cutoff = extractedData.shippingDeadline;
      if (extractedData.shippingCutoff) newShowData.shipping_cutoff = extractedData.shippingCutoff;
      if (extractedData.shippingInfo) newShowData.shipping_info = extractedData.shippingInfo;
      if (extractedData.warehouseAddress) {
        // Append warehouse address to shipping info
        const existingInfo = newShowData.shipping_info || '';
        newShowData.shipping_info = existingInfo 
          ? `${existingInfo}\n\nAdvance Warehouse: ${extractedData.warehouseAddress}`
          : `Advance Warehouse: ${extractedData.warehouseAddress}`;
      }
      if (extractedData.shipToSite !== null) newShowData.ship_to_site = extractedData.shipToSite;
      if (extractedData.shipToWarehouse !== null) newShowData.ship_to_warehouse = extractedData.shipToWarehouse;
      
      // Lead Capture
      if (extractedData.leadCaptureSystem) newShowData.lead_capture_system = extractedData.leadCaptureSystem;
      
      // Costs
      if (extractedData.electricalCost) newShowData.electrical_cost = extractedData.electricalCost;
      if (extractedData.laborCost) newShowData.labor_cost = extractedData.laborCost;
      if (extractedData.internetCost) newShowData.internet_cost = extractedData.internetCost;
      if (extractedData.standardServicesCost) newShowData.standard_services_cost = extractedData.standardServicesCost;
      if (extractedData.utilitiesDetails) newShowData.utilities_details = extractedData.utilitiesDetails;
      if (extractedData.laborDetails) newShowData.labor_details = extractedData.laborDetails;
      
      // Speaking & Sponsorship
      if (extractedData.hasSpeakingEngagement !== null) newShowData.has_speaking_engagement = extractedData.hasSpeakingEngagement;
      if (extractedData.speakingDetails) newShowData.speaking_details = extractedData.speakingDetails;
      if (extractedData.sponsorshipDetails) newShowData.sponsorship_details = extractedData.sponsorshipDetails;
      
      // Hotel
      if (extractedData.hotelName) newShowData.hotel_name = extractedData.hotelName;
      if (extractedData.hotelAddress) newShowData.hotel_address = extractedData.hotelAddress;
      if (extractedData.hotelCostPerNight) newShowData.hotel_cost_per_night = extractedData.hotelCostPerNight;
      
      // URLs & Portals
      if (extractedData.showWebsite) newShowData.show_website = extractedData.showWebsite;
      if (extractedData.showAgendaUrl) newShowData.show_agenda_url = extractedData.showAgendaUrl;
      if (extractedData.eventPortalUrl) newShowData.event_portal_url = extractedData.eventPortalUrl;
      
      // Event App
      if (extractedData.hasEventApp !== null) newShowData.has_event_app = extractedData.hasEventApp;
      if (extractedData.eventAppNotes) newShowData.event_app_notes = extractedData.eventAppNotes;
      
      // Contacts
      if (extractedData.showContactName) newShowData.show_contact_name = extractedData.showContactName;
      if (extractedData.showContactEmail) newShowData.show_contact_email = extractedData.showContactEmail;
      if (extractedData.showContactPhone) newShowData.show_contact_phone = extractedData.showContactPhone;
      
      // Show Website
      if (extractedData.showWebsite) newShowData.show_website = extractedData.showWebsite;
      
      // Notes
      if (extractedData.notes) newShowData.general_notes = extractedData.notes;

      // Create the show
      const { data: newShow, error: createError } = await supabase
        .from('tradeshows')
        .insert(newShowData)
        .select()
        .single();

      if (createError) throw createError;

      // Set the new show as target for task creation
      if (newShow) {
        setTargetShowId(String(newShow.id));
      }

      // Clear cache and refresh shows list so sidebar updates
      cacheService.clearCache('shows_upcoming');
      cacheService.clearCache('shows_historical');
      await loadShows();

      setSuccessMessage(`Created new show: ${newShow?.name || 'Unknown'}`);
      toast.success('New show created from document!');

      // Auto-create tasks if there are deadlines
      if (deadlineCount > 0 && newShow) {
        await handleCreateTasksForShow(newShow.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create show');
      toast.error('Failed to create show');
    }

    setIsApplying(false);
  };

  const handleApplyToShow = async () => {
    if (!extractedData || !selectedShow) {
      toast.error('Please select a show first');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      // Use snake_case for database columns
      const updates: Record<string, unknown> = {};
      
      // Basic Info
      if (extractedData.name) updates.name = extractedData.name;
      if (extractedData.startDate) updates.start_date = extractedData.startDate;
      if (extractedData.endDate) updates.end_date = extractedData.endDate;
      if (extractedData.location) updates.location = extractedData.location;
      if (extractedData.boothNumber) updates.booth_number = extractedData.boothNumber;
      if (extractedData.boothSize) updates.booth_size = extractedData.boothSize;
      if (extractedData.cost) updates.cost = extractedData.cost;
      if (extractedData.attendeesIncluded) updates.attendees_included = extractedData.attendeesIncluded;
      if (extractedData.managementCompany) updates.management_company = extractedData.managementCompany;
      
      // Event Type & Virtual
      if (extractedData.eventType) updates.event_type = extractedData.eventType;
      if (extractedData.virtualPlatform) updates.virtual_platform = extractedData.virtualPlatform;
      if (extractedData.virtualPlatformUrl) updates.virtual_platform_url = extractedData.virtualPlatformUrl;
      if (extractedData.virtualBoothUrl) updates.virtual_booth_url = extractedData.virtualBoothUrl;
      
      // Venue
      if (extractedData.venueName) updates.venue_name = extractedData.venueName;
      if (extractedData.venueAddress) updates.venue_address = extractedData.venueAddress;
      
      // Move-in/Move-out
      if (extractedData.moveInDate) updates.move_in_date = extractedData.moveInDate;
      if (extractedData.moveInTime) updates.move_in_time = extractedData.moveInTime;
      if (extractedData.moveOutDate) updates.move_out_date = extractedData.moveOutDate;
      if (extractedData.moveOutTime) updates.move_out_time = extractedData.moveOutTime;
      
      // Shipping & Logistics
      if (extractedData.shippingDeadline || extractedData.shippingCutoff) {
        updates.shipping_cutoff = extractedData.shippingDeadline || extractedData.shippingCutoff;
      }
      if (extractedData.shippingInfo || extractedData.warehouseAddress) {
        const parts = [];
        if (extractedData.shippingInfo) parts.push(extractedData.shippingInfo);
        if (extractedData.warehouseAddress) parts.push(`Advance Warehouse: ${extractedData.warehouseAddress}`);
        const existingInfo = selectedShow.shippingInfo || '';
        updates.shipping_info = existingInfo 
          ? `${existingInfo}\n\n${parts.join('\n\n')}`
          : parts.join('\n\n');
      }
      if (extractedData.shipToSite !== null) updates.ship_to_site = extractedData.shipToSite;
      if (extractedData.shipToWarehouse !== null) updates.ship_to_warehouse = extractedData.shipToWarehouse;
      
      // Lead Capture
      if (extractedData.leadCaptureSystem) updates.lead_capture_system = extractedData.leadCaptureSystem;
      
      // Costs
      if (extractedData.electricalCost) updates.electrical_cost = extractedData.electricalCost;
      if (extractedData.laborCost) updates.labor_cost = extractedData.laborCost;
      if (extractedData.internetCost) updates.internet_cost = extractedData.internetCost;
      if (extractedData.standardServicesCost) updates.standard_services_cost = extractedData.standardServicesCost;
      if (extractedData.utilitiesDetails) updates.utilities_details = extractedData.utilitiesDetails;
      if (extractedData.laborDetails) updates.labor_details = extractedData.laborDetails;
      
      // Speaking & Sponsorship
      if (extractedData.hasSpeakingEngagement !== null) updates.has_speaking_engagement = extractedData.hasSpeakingEngagement;
      if (extractedData.speakingDetails) updates.speaking_details = extractedData.speakingDetails;
      if (extractedData.sponsorshipDetails) updates.sponsorship_details = extractedData.sponsorshipDetails;
      
      // Hotel
      if (extractedData.hotelName) updates.hotel_name = extractedData.hotelName;
      if (extractedData.hotelAddress) updates.hotel_address = extractedData.hotelAddress;
      if (extractedData.hotelCostPerNight) updates.hotel_cost_per_night = extractedData.hotelCostPerNight;
      
      // URLs & Portals
      if (extractedData.showWebsite) updates.show_website = extractedData.showWebsite;
      if (extractedData.showAgendaUrl) updates.show_agenda_url = extractedData.showAgendaUrl;
      if (extractedData.eventPortalUrl) updates.event_portal_url = extractedData.eventPortalUrl;
      
      // Event App
      if (extractedData.hasEventApp !== null) updates.has_event_app = extractedData.hasEventApp;
      if (extractedData.eventAppNotes) updates.event_app_notes = extractedData.eventAppNotes;
      
      // Contacts
      if (extractedData.showContactName) updates.show_contact_name = extractedData.showContactName;
      if (extractedData.showContactEmail) updates.show_contact_email = extractedData.showContactEmail;
      if (extractedData.showContactPhone) updates.show_contact_phone = extractedData.showContactPhone;
      
      // Show Website
      if (extractedData.showWebsite) updates.show_website = extractedData.showWebsite;
      
      // Notes
      if (extractedData.notes) {
        const existingNotes = selectedShow.generalNotes || '';
        updates.general_notes = existingNotes 
          ? `${existingNotes}\n\n--- Extracted Notes ---\n${extractedData.notes}`
          : extractedData.notes;
      }

      // Apply updates directly via Supabase
      const { error: updateError } = await supabase
        .from('tradeshows')
        .update(updates)
        .eq('id', selectedShow.id);
      
      if (updateError) throw updateError;
      
      // Clear cache and refresh shows list so sidebar updates
      cacheService.clearCache('shows_upcoming');
      cacheService.clearCache('shows_historical');
      await loadShows();
      
      setSuccessMessage('Show fields updated successfully!');
      toast.success('Show fields updated from document');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply data');
      toast.error('Failed to update show');
    }

    setIsApplying(false);
  };

  // Helper to create tasks for a specific show ID from all extracted deadlines
  const handleCreateTasksForShow = async (showId?: number) => {
    if (!organization?.id || !user?.id) {
      return 0;
    }

    let created = 0;
    
    // Map of deadline fields to task titles
    const deadlineFields: Array<{ field: keyof aiService.ExtractedShowData; title: string }> = [
      { field: 'earlyBirdDeadline', title: 'Early Bird Deadline' },
      { field: 'registrationDeadline', title: 'Registration Deadline' },
      { field: 'housingDeadline', title: 'Housing/Hotel Block Deadline' },
      { field: 'serviceKitDeadline', title: 'Service Kit / Exhibitor Kit Deadline' },
      { field: 'shippingDeadline', title: 'Advance Warehouse Shipping Deadline' },
      { field: 'shippingCutoff', title: 'Direct-to-Site Shipping Cutoff' },
    ];
    
    for (const { field, title } of deadlineFields) {
      const dateValue = extractedData?.[field];
      if (dateValue && typeof dateValue === 'string') {
        await taskService.createTask(organization.id, user.id, {
          title,
          description: `Deadline extracted from: ${fileName}`,
          tradeShowId: showId,
          dueDate: dateValue,
          priority: 'high',
        });
        created++;
      }
    }
    
    // Create move-in reminder task if we have a move-in date
    if (extractedData?.moveInDate) {
      const moveInTime = extractedData.moveInTime ? ` (${extractedData.moveInTime})` : '';
      await taskService.createTask(organization.id, user.id, {
        title: 'Move-In / Setup Day',
        description: `Exhibitor move-in${moveInTime}. Extracted from: ${fileName}`,
        tradeShowId: showId,
        dueDate: extractedData.moveInDate,
        priority: 'high',
      });
      created++;
    }
    
    // Create move-out reminder task if we have a move-out date
    if (extractedData?.moveOutDate) {
      const moveOutTime = extractedData.moveOutTime ? ` (${extractedData.moveOutTime})` : '';
      await taskService.createTask(organization.id, user.id, {
        title: 'Move-Out / Teardown Day',
        description: `Exhibitor move-out${moveOutTime}. Extracted from: ${fileName}`,
        tradeShowId: showId,
        dueDate: extractedData.moveOutDate,
        priority: 'medium',
      });
      created++;
    }
    
    return created;
  };

  // Count how many deadline fields have values
  const countDeadlines = (): number => {
    if (!extractedData) return 0;
    let count = 0;
    const deadlineFields = [
      'earlyBirdDeadline', 'registrationDeadline', 'housingDeadline',
      'serviceKitDeadline', 'shippingDeadline', 'shippingCutoff',
      'moveInDate', 'moveOutDate'
    ] as const;
    for (const field of deadlineFields) {
      if (extractedData[field]) count++;
    }
    return count;
  };
  
  const deadlineCount = countDeadlines();

  const handleCreateTasks = async () => {
    if (deadlineCount === 0) {
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
      const created = await handleCreateTasksForShow(selectedShow?.id);
      
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
    if (deadlineCount > 0) {
      await handleCreateTasks();
    }
  };

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
          <div className="space-y-3 pt-4 border-t border-border">
            {/* Create New Show */}
            <Button 
              onClick={handleCreateNewShow} 
              disabled={isApplying || isCreatingTasks}
              className="w-full"
              variant="primary"
            >
              {isApplying ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create New Show
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-2 text-text-tertiary">or update existing</span>
              </div>
            </div>

            {/* Show Selector for Update */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Update Existing Show
              </label>
              <select
                value={targetShowId}
                onChange={(e) => setTargetShowId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text-primary text-sm focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="">Select a show...</option>
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedShow && (
              <Button 
                onClick={handleApplyAll} 
                disabled={isApplying || isCreatingTasks}
                className="w-full"
                variant="outline"
              >
                {(isApplying || isCreatingTasks) ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Update &quot;{selectedShow.name}&quot;
                  </>
                )}
              </Button>
            )}
            
            {/* Tasks - can create without a show */}
            <div className="pt-2 border-t border-border">
              <Button 
                onClick={handleCreateTasks} 
                disabled={isCreatingTasks || deadlineCount === 0}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <CheckSquare size={14} />
                Create {deadlineCount} Task{deadlineCount !== 1 ? 's' : ''} from Deadlines
              </Button>
              <p className="text-xs text-text-tertiary text-center mt-1">
                {selectedShow ? `Will link to "${selectedShow.name}"` : 'Tasks will be created without a show link'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Results */}
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        {extractedData ? (
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between sticky top-0 bg-background py-2">
              <h3 className="text-sm font-medium text-text-primary">
                Extracted Details
              </h3>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                extractedData.confidence === 'high' ? 'bg-success/20 text-success' :
                extractedData.confidence === 'medium' ? 'bg-warning/20 text-warning' :
                'bg-text-tertiary/20 text-text-tertiary'
              )}>
                {extractedData.confidence} confidence
              </span>
            </div>
            
            {/* Show Info */}
            {extractedData.name && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-brand-purple" />
                  <span className="text-sm font-medium text-text-primary">Show Info</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-text-secondary">Name:</span> <span className="text-text-primary font-medium">{extractedData.name}</span></p>
                  {extractedData.startDate && (
                    <p><span className="text-text-secondary">Dates:</span> <span className="text-text-primary">{extractedData.startDate} — {extractedData.endDate || 'TBD'}</span></p>
                  )}
                  {extractedData.location && (
                    <p><span className="text-text-secondary">Location:</span> <span className="text-text-primary">{extractedData.location}</span></p>
                  )}
                  {extractedData.eventType && (
                    <p><span className="text-text-secondary">Type:</span> <span className="text-text-primary capitalize">{extractedData.eventType.replace('_', ' ')}</span></p>
                  )}
                  {extractedData.managementCompany && (
                    <p><span className="text-text-secondary">Organizer:</span> <span className="text-text-primary">{extractedData.managementCompany}</span></p>
                  )}
                </div>
              </div>
            )}

            {/* Venue & Location */}
            {(extractedData.venueName || extractedData.venueAddress) && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-brand-cyan" />
                  <span className="text-sm font-medium text-text-primary">Venue</span>
                </div>
                <div className="space-y-1 text-sm">
                  {extractedData.venueName && <p className="text-text-primary font-medium">{extractedData.venueName}</p>}
                  {extractedData.venueAddress && <p className="text-text-secondary">{extractedData.venueAddress}</p>}
                </div>
              </div>
            )}

            {/* Booth */}
            {(extractedData.boothNumber || extractedData.boothSize || extractedData.cost) && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Building size={16} className="text-success" />
                  <span className="text-sm font-medium text-text-primary">Booth</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {extractedData.boothNumber && <p><span className="text-text-secondary">Number:</span> <span className="text-text-primary">{extractedData.boothNumber}</span></p>}
                  {extractedData.boothSize && <p><span className="text-text-secondary">Size:</span> <span className="text-text-primary">{extractedData.boothSize}</span></p>}
                  {extractedData.cost && <p><span className="text-text-secondary">Cost:</span> <span className="text-text-primary font-medium">${extractedData.cost.toLocaleString()}</span></p>}
                  {extractedData.attendeesIncluded && <p><span className="text-text-secondary">Badges:</span> <span className="text-text-primary">{extractedData.attendeesIncluded}</span></p>}
                </div>
              </div>
            )}

            {/* Move-in/Move-out */}
            {(extractedData.moveInDate || extractedData.moveOutDate) && (
              <div className="p-4 bg-brand-cyan/10 border border-brand-cyan/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-brand-cyan" />
                  <span className="text-sm font-medium text-text-primary">Setup / Teardown</span>
                </div>
                <div className="space-y-2">
                  {extractedData.moveInDate && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Move-In</p>
                        <p className="text-xs text-text-secondary">{extractedData.moveInDate}</p>
                        {extractedData.moveInTime && <p className="text-xs text-text-tertiary">{extractedData.moveInTime}</p>}
                      </div>
                    </div>
                  )}
                  {extractedData.moveOutDate && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Move-Out</p>
                        <p className="text-xs text-text-secondary">{extractedData.moveOutDate}</p>
                        {extractedData.moveOutTime && <p className="text-xs text-text-tertiary">{extractedData.moveOutTime}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deadlines */}
            {deadlineCount > 0 && (
              <div className="p-4 bg-brand-purple/10 border border-brand-purple/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare size={16} className="text-brand-purple" />
                  <span className="text-sm font-medium text-text-primary">Deadlines</span>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-brand-purple text-white">
                    {deadlineCount} found
                  </span>
                </div>
                <div className="space-y-2">
                  {extractedData.earlyBirdDeadline && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Early Bird</p>
                        <p className="text-xs text-text-secondary">{extractedData.earlyBirdDeadline}</p>
                      </div>
                    </div>
                  )}
                  {extractedData.registrationDeadline && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Registration</p>
                        <p className="text-xs text-text-secondary">{extractedData.registrationDeadline}</p>
                      </div>
                    </div>
                  )}
                  {extractedData.housingDeadline && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Housing Block</p>
                        <p className="text-xs text-text-secondary">{extractedData.housingDeadline}</p>
                      </div>
                    </div>
                  )}
                  {extractedData.serviceKitDeadline && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Service Kit / Exhibitor Kit</p>
                        <p className="text-xs text-text-secondary">{extractedData.serviceKitDeadline}</p>
                      </div>
                    </div>
                  )}
                  {extractedData.shippingDeadline && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <Package size={14} className="text-brand-purple mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Advance Warehouse</p>
                        <p className="text-xs text-text-secondary">{extractedData.shippingDeadline}</p>
                      </div>
                    </div>
                  )}
                  {extractedData.shippingCutoff && (
                    <div className="flex items-start gap-3 p-2 bg-surface rounded-lg">
                      <Package size={14} className="text-brand-purple mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Direct-to-Site Cutoff</p>
                        <p className="text-xs text-text-secondary">{extractedData.shippingCutoff}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Costs */}
            {(extractedData.electricalCost || extractedData.laborCost || extractedData.internetCost || extractedData.standardServicesCost) && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={16} className="text-warning" />
                  <span className="text-sm font-medium text-text-primary">Service Costs</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {extractedData.electricalCost && <p><span className="text-text-secondary">Electrical:</span> <span className="text-text-primary">${extractedData.electricalCost.toLocaleString()}</span></p>}
                  {extractedData.laborCost && <p><span className="text-text-secondary">Labor:</span> <span className="text-text-primary">${extractedData.laborCost.toLocaleString()}</span></p>}
                  {extractedData.internetCost && <p><span className="text-text-secondary">Internet:</span> <span className="text-text-primary">${extractedData.internetCost.toLocaleString()}</span></p>}
                  {extractedData.standardServicesCost && <p><span className="text-text-secondary">Drayage:</span> <span className="text-text-primary">${extractedData.standardServicesCost.toLocaleString()}</span></p>}
                </div>
                {extractedData.utilitiesDetails && <p className="text-xs text-text-tertiary mt-2">{extractedData.utilitiesDetails}</p>}
                {extractedData.laborDetails && <p className="text-xs text-text-tertiary mt-1">{extractedData.laborDetails}</p>}
              </div>
            )}

            {/* Hotel */}
            {(extractedData.hotelName || extractedData.hotelAddress || extractedData.hotelCostPerNight) && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Building size={16} className="text-text-tertiary" />
                  <span className="text-sm font-medium text-text-primary">Hotel</span>
                </div>
                <div className="space-y-1 text-sm">
                  {extractedData.hotelName && <p className="text-text-primary font-medium">{extractedData.hotelName}</p>}
                  {extractedData.hotelAddress && <p className="text-text-secondary">{extractedData.hotelAddress}</p>}
                  {extractedData.hotelCostPerNight && <p className="text-text-secondary">${extractedData.hotelCostPerNight}/night</p>}
                </div>
              </div>
            )}

            {/* Shipping */}
            {(extractedData.shippingInfo || extractedData.warehouseAddress) && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Package size={16} className="text-text-tertiary" />
                  <span className="text-sm font-medium text-text-primary">Shipping</span>
                </div>
                <div className="space-y-2 text-sm">
                  {extractedData.warehouseAddress && (
                    <div>
                      <p className="text-text-secondary text-xs">Advance Warehouse:</p>
                      <p className="text-text-primary">{extractedData.warehouseAddress}</p>
                    </div>
                  )}
                  {extractedData.shippingInfo && <p className="text-text-secondary whitespace-pre-wrap">{extractedData.shippingInfo}</p>}
                  <div className="flex gap-4">
                    {extractedData.shipToSite !== null && (
                      <span className={cn('text-xs', extractedData.shipToSite ? 'text-success' : 'text-text-tertiary')}>
                        {extractedData.shipToSite ? '✓' : '✗'} Direct-to-site
                      </span>
                    )}
                    {extractedData.shipToWarehouse !== null && (
                      <span className={cn('text-xs', extractedData.shipToWarehouse ? 'text-success' : 'text-text-tertiary')}>
                        {extractedData.shipToWarehouse ? '✓' : '✗'} Warehouse
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Contact */}
            {(extractedData.showContactName || extractedData.showContactEmail || extractedData.showContactPhone) && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-text-tertiary" />
                  <span className="text-sm font-medium text-text-primary">Contact</span>
                </div>
                <div className="space-y-1 text-sm">
                  {extractedData.showContactName && <p className="text-text-primary font-medium">{extractedData.showContactName}</p>}
                  {extractedData.showContactEmail && <p className="text-text-secondary">{extractedData.showContactEmail}</p>}
                  {extractedData.showContactPhone && <p className="text-text-secondary">{extractedData.showContactPhone}</p>}
                </div>
              </div>
            )}

            {/* URLs */}
            {(extractedData.showWebsite || extractedData.showAgendaUrl || extractedData.eventPortalUrl) && (
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink size={16} className="text-text-tertiary" />
                  <span className="text-sm font-medium text-text-primary">Links</span>
                </div>
                <div className="space-y-2 text-sm">
                  {extractedData.showWebsite && (
                    <a href={extractedData.showWebsite} target="_blank" rel="noopener noreferrer" 
                       className="block text-brand-purple hover:underline truncate">{extractedData.showWebsite}</a>
                  )}
                  {extractedData.showAgendaUrl && (
                    <a href={extractedData.showAgendaUrl} target="_blank" rel="noopener noreferrer"
                       className="block text-brand-purple hover:underline truncate">Agenda</a>
                  )}
                  {extractedData.eventPortalUrl && (
                    <a href={extractedData.eventPortalUrl} target="_blank" rel="noopener noreferrer"
                       className="block text-brand-purple hover:underline truncate">Exhibitor Portal</a>
                  )}
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

            {/* Extracted Fields Summary */}
            {extractedData.extractedFields?.length > 0 && (
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <p className="text-xs text-text-tertiary">
                  <span className="font-medium">{extractedData.extractedFields.length}</span> fields extracted: {extractedData.extractedFields.slice(0, 10).join(', ')}{extractedData.extractedFields.length > 10 ? '...' : ''}
                </p>
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

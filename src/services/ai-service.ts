/**
 * AI Service - Claude API integration for Booth
 * Uses server-side API routes for security (no client-side API keys)
 */

// Types
export interface AISettings {
  apiKey: string | null;
  model: 'claude-sonnet-4-20250514' | 'claude-3-5-sonnet-20241022' | 'claude-3-haiku-20240307';
  enabled: boolean;
}

export interface ContentGenerationRequest {
  type: 'talking_points' | 'social_post' | 'follow_up_email' | 'post_show_report' | 'checklist';
  context: {
    showName?: string;
    showLocation?: string;
    showDates?: string;
    products?: string;
    audience?: string;
    leadName?: string;
    leadNotes?: string;
    metrics?: Record<string, number>;
    customPrompt?: string;
  };
}

export interface DocumentAnalysisRequest {
  documentText: string;
  analysisType: 'extract_deadlines' | 'summarize' | 'extract_requirements' | 'custom';
  customQuery?: string;
  onProgress?: (progress: { current: number; total: number; stage: string }) => void;
}

// Chunking configuration
const CHUNK_THRESHOLD = 40000; // ~10k tokens, start chunking above this
const CHUNK_SIZE = 30000; // ~7.5k tokens per chunk
const CHUNK_OVERLAP = 500; // Overlap to maintain context

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ShowAssistantRequest {
  messages: ChatMessage[];
  showContext?: {
    shows?: Array<{
      name: string;
      dates: string;
      location: string;
      status: string;
      boothNumber?: string;
      boothSize?: string;
      cost?: number;
      shippingCutoff?: string;
      shippingInfo?: string;
      trackingNumber?: string;
      hotelName?: string;
      hotelConfirmed?: boolean;
      registrationConfirmed?: boolean;
      utilitiesBooked?: boolean;
      laborBooked?: boolean;
      totalLeads?: number;
      qualifiedLeads?: number;
      generalNotes?: string;
      showContactName?: string;
      showContactEmail?: string;
    }>;
    currentShow?: Record<string, unknown>;
    attendeesByShow?: Record<string, Array<{
      name: string | null;
      email: string | null;
      arrivalDate: string | null;
      departureDate: string | null;
    }>>;
    uploadedDocuments?: string;
  };
}

// Default settings
export const DEFAULT_AI_SETTINGS: AISettings = {
  apiKey: null,
  model: 'claude-sonnet-4-20250514',
  enabled: false,
};

// Track if key has been loaded/verified
let keyLoadedFromDb = false;
let hasValidKey = false;

export function hasApiKey(): boolean {
  return hasValidKey;
}

export function isKeyLoadedFromDb(): boolean {
  return keyLoadedFromDb;
}

export function setKeyLoaded(loaded: boolean, valid: boolean = false) {
  keyLoadedFromDb = loaded;
  hasValidKey = valid;
}

// Type for Supabase client (avoid circular import)
type SupabaseClient = {
  from: (table: string) => { select: (columns: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }> } } };
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
};

/**
 * Check if API key exists in org settings
 */
export async function loadApiKeyFromOrg(supabase: SupabaseClient, orgId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('v_organization_ai_settings')
      .select('ai_api_key')
      .eq('id', orgId)
      .single();

    if (error) {
      console.error('Failed to load AI API key:', error);
      return null;
    }

    if (data?.ai_api_key && typeof data.ai_api_key === 'string') {
      keyLoadedFromDb = true;
      hasValidKey = true;
      // Don't return the actual key - it stays server-side
      return '[configured]';
    }
    keyLoadedFromDb = true;
    hasValidKey = false;
    return null;
  } catch (err) {
    console.error('Error loading AI API key:', err);
    return null;
  }
}

/**
 * Save API key to Supabase org settings (encrypted)
 */
export async function saveApiKeyToOrg(supabase: SupabaseClient, orgId: string, apiKey: string | null): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('set_ai_api_key', {
      p_org_id: orgId,
      p_api_key: apiKey || '',
    });

    if (error) {
      console.error('Failed to save AI API key:', error);
      return false;
    }

    keyLoadedFromDb = true;
    hasValidKey = !!apiKey;
    return true;
  } catch (err) {
    console.error('Error saving AI API key:', err);
    return false;
  }
}

/**
 * Call the secure server-side AI API
 */
async function callAIAPI(prompt: string, systemPrompt?: string, orgId?: string): Promise<string> {
  if (!orgId) {
    throw new Error('Organization ID required');
  }

  // Get auth token - need to dynamically import to avoid circular deps
  const { supabase } = await import('@/lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      systemPrompt,
      orgId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'AI request failed');
  }

  return data.response;
}

// Store current org ID for API calls
let currentOrgId: string | null = null;

export function setCurrentOrg(orgId: string) {
  currentOrgId = orgId;
}

/**
 * Content Generation
 */
export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  if (!currentOrgId) {
    throw new Error('Organization not set. Please reload the page.');
  }

  const prompts: Record<ContentGenerationRequest['type'], string> = {
    talking_points: `Generate 5-7 compelling talking points for a trade show booth.

Show: ${request.context.showName || 'Trade Show'}
Location: ${request.context.showLocation || 'N/A'}
Dates: ${request.context.showDates || 'N/A'}
Products/Services: ${request.context.products || 'Not specified'}
Target Audience: ${request.context.audience || 'General attendees'}

Generate conversation starters and key value propositions that will resonate with this audience. Be specific and actionable.`,

    social_post: `Generate 3 engaging LinkedIn posts about attending a trade show.

Show: ${request.context.showName || 'Trade Show'}
Location: ${request.context.showLocation || 'N/A'}
Dates: ${request.context.showDates || 'N/A'}
${request.context.customPrompt ? `Additional context: ${request.context.customPrompt}` : ''}

Create posts that are professional but engaging, include relevant hashtags, and encourage booth visits. Vary the tone - one can be more casual, one informative, one with a call-to-action.`,

    follow_up_email: `Write a personalized follow-up email after meeting someone at a trade show.

Show: ${request.context.showName || 'Trade Show'}
Lead Name: ${request.context.leadName || 'Contact'}
Notes from conversation: ${request.context.leadNotes || 'Met at booth, expressed interest'}
${request.context.customPrompt ? `Additional context: ${request.context.customPrompt}` : ''}

The email should:
1. Reference the specific conversation
2. Provide value (not just "checking in")
3. Have a clear call-to-action
4. Be concise (under 150 words)`,

    post_show_report: `Create an executive summary report for a trade show.

Show: ${request.context.showName || 'Trade Show'}
Location: ${request.context.showLocation || 'N/A'}
Dates: ${request.context.showDates || 'N/A'}
Metrics: ${JSON.stringify(request.context.metrics || {}, null, 2)}
${request.context.customPrompt ? `Additional notes: ${request.context.customPrompt}` : ''}

Include:
1. Executive Summary (2-3 sentences)
2. Key Metrics & Performance
3. Top Highlights
4. Challenges & Lessons Learned
5. Recommendations for Future Shows

Be specific and data-driven where possible.`,

    checklist: `Generate a comprehensive packing/preparation checklist for a trade show.

Show: ${request.context.showName || 'Trade Show'}
Location: ${request.context.showLocation || 'N/A'}
Dates: ${request.context.showDates || 'N/A'}
${request.context.customPrompt ? `Specific needs: ${request.context.customPrompt}` : ''}

Categories to cover:
1. Booth Materials & Displays
2. Marketing Collateral
3. Technology & Equipment
4. Personal Items for Staff
5. Documentation & Paperwork
6. Emergency/Backup Items

Format as a clean checklist with checkboxes (- [ ]).`,
  };

  const systemPrompt = 'You are a trade show expert helping users prepare for and execute successful trade shows.';

  return callAIAPI(prompts[request.type], systemPrompt, currentOrgId);
}

/**
 * Split text into overlapping chunks
 */
function chunkDocument(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    
    // Try to break at a paragraph or sentence boundary
    if (end < text.length) {
      // Look for paragraph break
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + CHUNK_SIZE * 0.7) {
        end = paragraphBreak;
      } else {
        // Look for sentence break
        const sentenceBreak = text.lastIndexOf('. ', end);
        if (sentenceBreak > start + CHUNK_SIZE * 0.7) {
          end = sentenceBreak + 1;
        }
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
    
    // Avoid infinite loop on very long unbreakable content
    if (start <= chunks.length * CHUNK_SIZE * 0.5) {
      start = end;
    }
  }
  
  return chunks.filter(c => c.length > 100); // Filter out tiny fragments
}

/**
 * Get chunk-specific prompts for each analysis type
 */
function getChunkPrompt(analysisType: DocumentAnalysisRequest['analysisType'], chunkText: string, chunkIndex: number, totalChunks: number, customQuery?: string): string {
  const chunkInfo = `[Analyzing section ${chunkIndex + 1} of ${totalChunks}]`;
  
  const prompts: Record<DocumentAnalysisRequest['analysisType'], string> = {
    extract_deadlines: `${chunkInfo}

Extract ALL deadlines, dates, and time-sensitive requirements from this section of a trade show document.

Document Section:
${chunkText}

List each deadline with:
- Date/Deadline
- What it's for
- Any penalties mentioned

Only include items actually found in this section.`,

    summarize: `${chunkInfo}

Extract the KEY information from this section of a trade show document.

Document Section:
${chunkText}

List:
- Main topics covered
- Important requirements
- Key facts/numbers
- Contacts mentioned

Be concise - focus on what matters most for an exhibitor.`,

    extract_requirements: `${chunkInfo}

Extract all requirements, rules, and specifications from this section.

Document Section:
${chunkText}

Include any requirements related to:
- Booth setup
- Electrical/utilities
- Shipping/drayage
- Badges/registration
- Prohibited items
- Insurance/liability

Only include items actually in this section.`,

    custom: `${chunkInfo}

Based on this section, find information relevant to: ${customQuery}

Document Section:
${chunkText}

If this section contains relevant information, summarize it. If not, say "No relevant information in this section."`,
  };
  
  return prompts[analysisType];
}

/**
 * Get merge prompt to combine chunk results
 */
function getMergePrompt(analysisType: DocumentAnalysisRequest['analysisType'], chunkResults: string[], customQuery?: string): string {
  const combined = chunkResults.map((r, i) => `--- Section ${i + 1} Results ---\n${r}`).join('\n\n');
  
  const prompts: Record<DocumentAnalysisRequest['analysisType'], string> = {
    extract_deadlines: `I've analyzed a large document in sections. Here are the deadlines found in each section:

${combined}

Now create a FINAL consolidated list of all deadlines:
1. Remove duplicates (same deadline mentioned in multiple sections)
2. Sort chronologically from soonest to latest
3. Format cleanly with date, description, and any penalties

Provide the final, deduplicated, sorted list.`,

    summarize: `I've analyzed a large document in sections. Here are the key points from each:

${combined}

Now create a FINAL executive summary:
1. One-paragraph overview
2. Key requirements (deduplicated bullet points)
3. Important contacts/resources
4. Notable policies or restrictions

Synthesize into a cohesive summary, removing redundancy.`,

    extract_requirements: `I've analyzed a large document in sections. Here are the requirements from each:

${combined}

Now create a FINAL consolidated requirements list:
1. Merge and deduplicate requirements
2. Categorize into: Booth Setup, Electrical/Utility, Shipping/Drayage, Badges/Registration, Prohibited Items, Insurance/Liability
3. Remove redundant items

Provide the complete, organized requirements list.`,

    custom: `I've searched a large document in sections for: "${customQuery}"

Here's what was found in each section:
${combined}

Now provide a FINAL consolidated answer:
1. Combine all relevant findings
2. Remove redundant information
3. Give a clear, direct answer

If nothing relevant was found, say so clearly.`,
  };
  
  return prompts[analysisType];
}

/**
 * Document Intelligence - with hierarchical chunking for large documents
 */
export async function analyzeDocument(request: DocumentAnalysisRequest): Promise<string> {
  if (!currentOrgId) {
    throw new Error('Organization not set. Please reload the page.');
  }

  const { documentText, analysisType, customQuery, onProgress } = request;
  const systemPrompt = 'You are an expert at analyzing trade show and exhibitor documents. Be thorough and precise.';

  // Check if document is small enough for direct processing
  if (documentText.length <= CHUNK_THRESHOLD) {
    onProgress?.({ current: 1, total: 1, stage: 'Analyzing document...' });
    
    const prompts: Record<DocumentAnalysisRequest['analysisType'], string> = {
      extract_deadlines: `Analyze this trade show document and extract ALL deadlines, dates, and time-sensitive requirements.

Document:
${documentText}

Format the output as a structured list with:
- Date/Deadline
- What it's for
- Any associated costs or penalties for missing it

Sort chronologically from soonest to latest.`,

      summarize: `Summarize this trade show document, highlighting the most important information for an exhibitor.

Document:
${documentText}

Provide:
1. One-paragraph executive summary
2. Key requirements (bullet points)
3. Important contacts/resources mentioned
4. Any notable policies or restrictions`,

      extract_requirements: `Extract all requirements, rules, and specifications from this exhibitor document.

Document:
${documentText}

Categorize into:
1. Booth Setup Requirements
2. Electrical/Utility Requirements
3. Shipping/Drayage Requirements
4. Badge/Registration Requirements
5. Prohibited Items/Activities
6. Insurance/Liability Requirements

Be thorough - exhibitors need to know everything required of them.`,

      custom: `Analyze this document and answer the following question:

Question: ${customQuery}

Document:
${documentText}

Provide a clear, direct answer based only on information in the document. If the information isn't in the document, say so.`,
    };

    return callAIAPI(prompts[analysisType], systemPrompt, currentOrgId);
  }

  // Large document - use hierarchical chunking
  const chunks = chunkDocument(documentText);
  const totalSteps = chunks.length + 1; // chunks + merge step
  
  onProgress?.({ current: 0, total: totalSteps, stage: `Processing ${chunks.length} sections...` });

  // Process chunks in parallel (batch of 3 to avoid rate limits)
  const chunkResults: string[] = [];
  const batchSize = 3;
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchPromises = batch.map((chunk, batchIndex) => {
      const chunkIndex = i + batchIndex;
      const prompt = getChunkPrompt(analysisType, chunk, chunkIndex, chunks.length, customQuery);
      return callAIAPI(prompt, systemPrompt, currentOrgId!);
    });
    
    const batchResults = await Promise.all(batchPromises);
    chunkResults.push(...batchResults);
    
    onProgress?.({ 
      current: Math.min(i + batchSize, chunks.length), 
      total: totalSteps, 
      stage: `Analyzed ${Math.min(i + batchSize, chunks.length)} of ${chunks.length} sections` 
    });
  }

  // Merge results
  onProgress?.({ current: chunks.length, total: totalSteps, stage: 'Consolidating results...' });
  
  const mergePrompt = getMergePrompt(analysisType, chunkResults, customQuery);
  const finalResult = await callAIAPI(mergePrompt, systemPrompt, currentOrgId);
  
  onProgress?.({ current: totalSteps, total: totalSteps, stage: 'Complete' });
  
  return finalResult;
}

/**
 * Show Assistant - Conversational AI
 */
export async function chatWithAssistant(request: ShowAssistantRequest): Promise<string> {
  if (!currentOrgId) {
    throw new Error('Organization not set. Please reload the page.');
  }

  // Build conversation prompt from messages
  const conversationHistory = request.messages
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  // Build context sections with detailed show info
  const contextInfo = request.showContext?.shows 
    ? `\n\n**Your Shows:**\n${request.showContext.shows.map(s => {
        const details: string[] = [];
        details.push(`**${s.name}**`);
        details.push(`  Location: ${s.location}, Dates: ${s.dates}, Status: ${s.status}`);
        if (s.boothNumber || s.boothSize) details.push(`  Booth: ${[s.boothNumber, s.boothSize].filter(Boolean).join(' - ')}`);
        if (s.cost) details.push(`  Cost: $${s.cost.toLocaleString()}`);
        if (s.shippingCutoff) details.push(`  Shipping Cutoff: ${s.shippingCutoff}`);
        if (s.shippingInfo) details.push(`  Shipping Info: ${s.shippingInfo}`);
        if (s.trackingNumber) details.push(`  Tracking #: ${s.trackingNumber}`);
        if (s.hotelName) details.push(`  Hotel: ${s.hotelName}${s.hotelConfirmed ? ' (Confirmed)' : ' (Not confirmed)'}`);
        if (s.registrationConfirmed !== undefined) details.push(`  Registration: ${s.registrationConfirmed ? 'Confirmed' : 'Not confirmed'}`);
        if (s.utilitiesBooked !== undefined) details.push(`  Utilities: ${s.utilitiesBooked ? 'Booked' : 'Not booked'}`);
        if (s.laborBooked !== undefined) details.push(`  Labor: ${s.laborBooked ? 'Booked' : 'Not booked'}`);
        if (s.totalLeads) details.push(`  Leads: ${s.totalLeads}${s.qualifiedLeads ? ` (${s.qualifiedLeads} qualified)` : ''}`);
        if (s.showContactName || s.showContactEmail) details.push(`  Contact: ${[s.showContactName, s.showContactEmail].filter(Boolean).join(' - ')}`);
        if (s.generalNotes) details.push(`  Notes: ${s.generalNotes.slice(0, 200)}${s.generalNotes.length > 200 ? '...' : ''}`);
        return details.join('\n');
      }).join('\n\n')}`
    : '';

  const currentShowInfo = request.showContext?.currentShow
    ? `\n\n**Currently Viewing Show:**\n${JSON.stringify(request.showContext.currentShow, null, 2)}`
    : '';

  // Build attendees info grouped by show
  const attendeesByShow = request.showContext?.attendeesByShow;
  let attendeesInfo = '';
  if (attendeesByShow && Object.keys(attendeesByShow).length > 0) {
    const showAttendeesList = Object.entries(attendeesByShow).map(([showName, attendees]) => {
      const attendeeList = attendees.map(a => 
        `  - ${a.name || 'Unnamed'}${a.email ? ` (${a.email})` : ''}${a.arrivalDate ? ` - Arrives: ${a.arrivalDate}` : ''}${a.departureDate ? `, Departs: ${a.departureDate}` : ''}`
      ).join('\n');
      return `**${showName}:**\n${attendeeList}`;
    }).join('\n\n');
    attendeesInfo = `\n\n**Attendees by Show:**\n${showAttendeesList}`;
  }

  // Truncate documents if too long (keep first 20k chars to avoid token limits)
  const docsText = request.showContext?.uploadedDocuments;
  const documentsInfo = docsText
    ? `\n\n**Uploaded Documents:**\n${docsText.length > 20000 ? docsText.slice(0, 20000) + '\n\n[Document truncated for length...]' : docsText}`
    : '';

  const prompt = `${conversationHistory}`;

  const systemPrompt = `You are an expert trade show assistant for "Booth" - a trade show management application. You help users plan, execute, and analyze their trade show programs.

You have access to the following context about the user's shows, attendees, and any documents they've uploaded:${contextInfo}${currentShowInfo}${attendeesInfo}${documentsInfo}

Be helpful, specific, and actionable. Reference the provided context when answering questions. If asked about data you don't have, suggest what information would be helpful. Keep responses concise but thorough.`;

  return callAIAPI(prompt, systemPrompt, currentOrgId);
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  if (!currentOrgId) {
    return { success: false, error: 'Organization not set' };
  }

  try {
    await callAIAPI('Hi, this is a connection test. Respond with "Connected!"', undefined, currentOrgId);
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Connection failed' 
    };
  }
}

// Legacy exports for compatibility (no-ops, key is server-side only now)
export function setApiKey(_key: string | null) {
  // No-op: keys are now stored server-side only
}

export function getApiKey(): string | null {
  // Never expose key to client
  return hasValidKey ? '[configured]' : null;
}

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
}

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
      leads?: number;
      cost?: number;
    }>;
    currentShow?: Record<string, unknown>;
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

  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
 * Document Intelligence
 */
export async function analyzeDocument(request: DocumentAnalysisRequest): Promise<string> {
  if (!currentOrgId) {
    throw new Error('Organization not set. Please reload the page.');
  }

  const prompts: Record<DocumentAnalysisRequest['analysisType'], string> = {
    extract_deadlines: `Analyze this trade show document and extract ALL deadlines, dates, and time-sensitive requirements.

Document:
${request.documentText}

Format the output as a structured list with:
- Date/Deadline
- What it's for
- Any associated costs or penalties for missing it

Sort chronologically from soonest to latest.`,

    summarize: `Summarize this trade show document, highlighting the most important information for an exhibitor.

Document:
${request.documentText}

Provide:
1. One-paragraph executive summary
2. Key requirements (bullet points)
3. Important contacts/resources mentioned
4. Any notable policies or restrictions`,

    extract_requirements: `Extract all requirements, rules, and specifications from this exhibitor document.

Document:
${request.documentText}

Categorize into:
1. Booth Setup Requirements
2. Electrical/Utility Requirements
3. Shipping/Drayage Requirements
4. Badge/Registration Requirements
5. Prohibited Items/Activities
6. Insurance/Liability Requirements

Be thorough - exhibitors need to know everything required of them.`,

    custom: `Analyze this document and answer the following question:

Question: ${request.customQuery}

Document:
${request.documentText}

Provide a clear, direct answer based only on information in the document. If the information isn't in the document, say so.`,
  };

  const systemPrompt = 'You are an expert at analyzing trade show and exhibitor documents.';

  return callAIAPI(prompts[request.analysisType], systemPrompt, currentOrgId);
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

  const contextInfo = request.showContext?.shows 
    ? `\nThe user has the following shows:\n${request.showContext.shows.map(s => 
        `- ${s.name} (${s.location}, ${s.dates}) - Status: ${s.status}${s.leads ? `, Leads: ${s.leads}` : ''}${s.cost ? `, Cost: $${s.cost}` : ''}`
      ).join('\n')}`
    : '';

  const currentShowInfo = request.showContext?.currentShow
    ? `\nCurrently viewing show: ${JSON.stringify(request.showContext.currentShow, null, 2)}`
    : '';

  const prompt = `${conversationHistory}`;

  const systemPrompt = `You are an expert trade show assistant for "Booth" - a trade show management application. You help users plan, execute, and analyze their trade show programs.${contextInfo}${currentShowInfo}

Be helpful, specific, and actionable. If asked about data you don't have, suggest what information would be helpful. Keep responses concise but thorough.`;

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

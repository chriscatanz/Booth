/**
 * AI Service - Claude API integration for Booth
 * Uses user-provided API key (BYOK model)
 */

import Anthropic from '@anthropic-ai/sdk';

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

// Store API key in memory (not persisted - user re-enters each session for security)
// Or could store encrypted in localStorage/Supabase Vault
let cachedApiKey: string | null = null;

export function setApiKey(key: string | null) {
  cachedApiKey = key;
}

export function getApiKey(): string | null {
  return cachedApiKey;
}

export function hasApiKey(): boolean {
  return !!cachedApiKey;
}

// Create Anthropic client
function getClient(): Anthropic {
  if (!cachedApiKey) {
    throw new Error('Claude API key not configured. Add your key in Settings → AI Assistant.');
  }
  return new Anthropic({ apiKey: cachedApiKey, dangerouslyAllowBrowser: true });
}

/**
 * Content Generation
 */
export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  const client = getClient();
  
  const prompts: Record<ContentGenerationRequest['type'], string> = {
    talking_points: `You are a trade show expert helping prepare booth staff. Generate 5-7 compelling talking points for a trade show booth.

Show: ${request.context.showName || 'Trade Show'}
Location: ${request.context.showLocation || 'N/A'}
Dates: ${request.context.showDates || 'N/A'}
Products/Services: ${request.context.products || 'Not specified'}
Target Audience: ${request.context.audience || 'General attendees'}

Generate conversation starters and key value propositions that will resonate with this audience. Be specific and actionable.`,

    social_post: `You are a marketing expert. Generate 3 engaging LinkedIn posts about attending a trade show.

Show: ${request.context.showName || 'Trade Show'}
Location: ${request.context.showLocation || 'N/A'}
Dates: ${request.context.showDates || 'N/A'}
${request.context.customPrompt ? `Additional context: ${request.context.customPrompt}` : ''}

Create posts that are professional but engaging, include relevant hashtags, and encourage booth visits. Vary the tone - one can be more casual, one informative, one with a call-to-action.`,

    follow_up_email: `You are a sales professional writing a follow-up email after meeting someone at a trade show.

Show: ${request.context.showName || 'Trade Show'}
Lead Name: ${request.context.leadName || 'Contact'}
Notes from conversation: ${request.context.leadNotes || 'Met at booth, expressed interest'}
${request.context.customPrompt ? `Additional context: ${request.context.customPrompt}` : ''}

Write a personalized, professional follow-up email that:
1. References the specific conversation
2. Provides value (not just "checking in")
3. Has a clear call-to-action
4. Is concise (under 150 words)`,

    post_show_report: `You are a trade show manager creating an executive summary report.

Show: ${request.context.showName || 'Trade Show'}
Location: ${request.context.showLocation || 'N/A'}
Dates: ${request.context.showDates || 'N/A'}
Metrics: ${JSON.stringify(request.context.metrics || {}, null, 2)}
${request.context.customPrompt ? `Additional notes: ${request.context.customPrompt}` : ''}

Create a professional post-show report with:
1. Executive Summary (2-3 sentences)
2. Key Metrics & Performance
3. Top Highlights
4. Challenges & Lessons Learned
5. Recommendations for Future Shows

Be specific and data-driven where possible.`,

    checklist: `You are a trade show logistics expert. Generate a comprehensive packing/preparation checklist.

Show: ${request.context.showName || 'Trade Show'}
Location: ${request.context.showLocation || 'N/A'}
Dates: ${request.context.showDates || 'N/A'}
${request.context.customPrompt ? `Specific needs: ${request.context.customPrompt}` : ''}

Create a categorized checklist covering:
1. Booth Materials & Displays
2. Marketing Collateral
3. Technology & Equipment
4. Personal Items for Staff
5. Documentation & Paperwork
6. Emergency/Backup Items

Format as a clean checklist with checkboxes (- [ ]).`,
  };

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      { role: 'user', content: prompts[request.type] }
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent?.text || 'Unable to generate content.';
}

/**
 * Document Intelligence
 */
export async function analyzeDocument(request: DocumentAnalysisRequest): Promise<string> {
  const client = getClient();
  
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

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
      { role: 'user', content: prompts[request.analysisType] }
    ],
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent?.text || 'Unable to analyze document.';
}

/**
 * Show Assistant - Conversational AI
 */
export async function chatWithAssistant(request: ShowAssistantRequest): Promise<string> {
  const client = getClient();
  
  const systemPrompt = `You are an expert trade show assistant for "Booth" - a trade show management application. You help users plan, execute, and analyze their trade show programs.

${request.showContext?.shows ? `
The user has the following shows in their system:
${request.showContext.shows.map(s => `- ${s.name} (${s.location}, ${s.dates}) - Status: ${s.status}${s.leads ? `, Leads: ${s.leads}` : ''}${s.cost ? `, Cost: $${s.cost}` : ''}`).join('\n')}
` : ''}

${request.showContext?.currentShow ? `
Currently viewing show: ${JSON.stringify(request.showContext.currentShow, null, 2)}
` : ''}

Be helpful, specific, and actionable. If asked about data you don't have, suggest what information would be helpful. Keep responses concise but thorough.`;

  const messages = request.messages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent?.text || 'I apologize, I was unable to process that request.';
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Connection failed' 
    };
  }
}

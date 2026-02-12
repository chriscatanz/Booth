import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Extracted show data structure matching TradeShow fields
interface ExtractedShowData {
  // Basic Info
  name: string | null;
  location: string | null;
  startDate: string | null;  // YYYY-MM-DD format
  endDate: string | null;
  boothNumber: string | null;
  boothSize: string | null;
  cost: number | null;
  
  // Event Details
  eventType: 'in_person' | 'virtual' | 'hybrid' | null;
  managementCompany: string | null;
  venueName: string | null;
  venueAddress: string | null;
  
  // Registration
  attendeesIncluded: number | null;
  
  // Deadlines (YYYY-MM-DD format)
  earlyBirdDeadline: string | null;
  registrationDeadline: string | null;
  housingDeadline: string | null;
  serviceKitDeadline: string | null;
  shippingDeadline: string | null;
  
  // Contacts
  showContactName: string | null;
  showContactEmail: string | null;
  showContactPhone: string | null;
  
  // URLs
  showWebsite: string | null;
  
  // Shipping
  shippingInfo: string | null;
  warehouseAddress: string | null;
  
  // Additional extracted info
  notes: string | null;
  
  // Confidence and source
  confidence: 'high' | 'medium' | 'low';
  extractedFields: string[];  // List of fields that were found
}

const EXTRACTION_PROMPT = `You are an expert at extracting trade show and exhibition information from documents.

Analyze the following document and extract all trade show details you can find. Return a JSON object with these fields:

{
  "name": "Show/event name",
  "location": "City, State/Country",
  "startDate": "YYYY-MM-DD format",
  "endDate": "YYYY-MM-DD format",
  "boothNumber": "Booth/stand number if mentioned",
  "boothSize": "Booth dimensions (e.g., '10x10', '20x20')",
  "cost": numeric value only (no currency symbols),
  "eventType": "in_person" | "virtual" | "hybrid",
  "managementCompany": "Show management company name",
  "venueName": "Venue/convention center name",
  "venueAddress": "Full street address of the venue",
  "attendeesIncluded": numeric value,
  "earlyBirdDeadline": "YYYY-MM-DD",
  "registrationDeadline": "YYYY-MM-DD",
  "housingDeadline": "YYYY-MM-DD",
  "serviceKitDeadline": "YYYY-MM-DD",
  "shippingDeadline": "YYYY-MM-DD",
  "showContactName": "Primary contact name",
  "showContactEmail": "Contact email",
  "showContactPhone": "Contact phone",
  "showWebsite": "Official show website URL",
  "shippingInfo": "Shipping/drayage instructions",
  "warehouseAddress": "Advance warehouse address",
  "notes": "Any other important details not captured above",
  "confidence": "high" | "medium" | "low",
  "extractedFields": ["list", "of", "fields", "you", "found"]
}

Rules:
1. Return ONLY valid JSON, no other text
2. Use null for fields you cannot find
3. Convert all dates to YYYY-MM-DD format (handle various date formats)
4. For cost, extract the numeric value only (e.g., "$5,000" → 5000)
5. If the year is not specified for dates, assume the next occurrence of that date
6. Set confidence based on how much information you found:
   - high: Found show name + dates + location
   - medium: Found show name + at least one other key field
   - low: Limited information extracted
7. List all fields you successfully extracted in extractedFields

DOCUMENT:
`;

// Sanitize document text to prevent prompt injection
function sanitizeDocumentText(text: string): string {
  // Remove potential prompt injection patterns
  let sanitized = text;
  
  // Remove attempts to break out of the document context
  sanitized = sanitized.replace(/```/g, '');
  
  // Remove common injection patterns
  const injectionPatterns = [
    /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi,
    /disregard\s+(previous|above|all)/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
    /assistant\s*:/gi,
    /user\s*:/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
  ];
  
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }
  
  return sanitized;
}

export async function POST(request: NextRequest) {
  try {
    // Try SSR-based auth first (for browser requests with cookies)
    let user = null;
    let supabase;
    
    try {
      supabase = await createServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      }
    } catch {
      // SSR client failed, try header-based auth
    }

    // Fallback to Authorization header
    if (!user) {
      const authHeader = request.headers.get('authorization');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (authHeader && supabaseUrl && supabaseAnonKey) {
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          user = data.user;
        }
      }
    }

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Database-based rate limiting
    const rateLimitKey = `ai-extract:${user.id}`;
    const { data: rateLimitOk, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_key: rateLimitKey,
        p_limit: 10,  // 10 extractions per minute
        p_window_seconds: 60
      });

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
    } else if (rateLimitOk === false) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request
    const body = await request.json();
    const { documentText, orgId } = body;

    if (!documentText || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields: documentText, orgId' },
        { status: 400 }
      );
    }

    if (documentText.length > 100000) {
      return NextResponse.json(
        { error: 'Document too large. Maximum 100,000 characters.' },
        { status: 400 }
      );
    }

    // Check subscription status - require active subscription for AI features
    const { data: subStatus, error: subError } = await supabase
      .rpc('get_subscription_status', { p_org_id: orgId });
    
    if (subError) {
      console.error('Subscription check failed:', subError);
    } else if (subStatus) {
      const isExpired = subStatus.is_expired;
      const tier = subStatus.tier;
      if (isExpired || tier === 'cancelled' || tier === 'expired') {
        return NextResponse.json(
          { error: 'Your subscription has expired. Please renew to use AI features.' },
          { status: 403 }
        );
      }
    }

    // Get API key from database
    const { data: aiSettings, error: settingsError } = await supabase
      .from('v_organization_ai_settings')
      .select('ai_api_key')
      .eq('id', orgId)
      .single();

    if (settingsError || !aiSettings?.ai_api_key) {
      return NextResponse.json(
        { error: 'AI not configured. Please add your API key in Settings.' },
        { status: 400 }
      );
    }

    // Verify user has access to this org
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: aiSettings.ai_api_key,
    });

    // Sanitize document text to prevent prompt injection
    const sanitizedText = sanitizeDocumentText(documentText);

    // Extract show data
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        { 
          role: 'user', 
          content: EXTRACTION_PROMPT + sanitizedText 
        }
      ],
    });

    // Parse response
    const textContent = message.content.find(c => c.type === 'text');
    const responseText = textContent?.text || '';

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    let extractedData: ExtractedShowData;
    try {
      extractedData = JSON.parse(jsonText.trim());
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });

  } catch (error) {
    console.error('Show extraction error:', error);
    
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your settings.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to extract show data. Please try again.' },
      { status: 500 }
    );
  }
}

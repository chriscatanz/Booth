import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Extracted show data structure matching TradeShow fields (comprehensive)
interface ExtractedShowData {
  // Basic Info
  name: string | null;
  location: string | null;
  startDate: string | null;  // YYYY-MM-DD format
  endDate: string | null;
  boothNumber: string | null;
  boothSize: string | null;
  cost: number | null;
  attendeesIncluded: number | null;
  managementCompany: string | null;
  
  // Event Type & Virtual Details
  eventType: 'in_person' | 'virtual' | 'hybrid' | null;
  virtualPlatform: string | null;
  virtualPlatformUrl: string | null;
  virtualBoothUrl: string | null;
  
  // Venue & Location
  venueName: string | null;
  venueAddress: string | null;
  
  // Move-in/Move-out
  moveInDate: string | null;   // YYYY-MM-DD format
  moveInTime: string | null;   // Time range e.g. "8:00 AM - 5:00 PM"
  moveOutDate: string | null;  // YYYY-MM-DD format
  moveOutTime: string | null;  // Time range e.g. "12:00 PM - 6:00 PM"
  
  // Deadlines (YYYY-MM-DD format)
  earlyBirdDeadline: string | null;
  registrationDeadline: string | null;
  housingDeadline: string | null;
  serviceKitDeadline: string | null;
  shippingDeadline: string | null;
  shippingCutoff: string | null;
  
  // Contacts
  showContactName: string | null;
  showContactEmail: string | null;
  showContactPhone: string | null;
  
  // URLs & Portals
  showWebsite: string | null;
  showAgendaUrl: string | null;
  eventPortalUrl: string | null;
  
  // Shipping & Logistics
  shippingInfo: string | null;
  warehouseAddress: string | null;
  shipToSite: boolean | null;
  shipToWarehouse: boolean | null;
  
  // Lead Capture
  leadCaptureSystem: string | null;
  
  // Services & Costs
  electricalCost: number | null;
  laborCost: number | null;
  internetCost: number | null;
  standardServicesCost: number | null;
  utilitiesDetails: string | null;
  laborDetails: string | null;
  
  // Speaking & Sponsorship
  hasSpeakingEngagement: boolean | null;
  speakingDetails: string | null;
  sponsorshipDetails: string | null;
  
  // Hotel
  hotelName: string | null;
  hotelAddress: string | null;
  hotelCostPerNight: number | null;
  
  // Event App
  hasEventApp: boolean | null;
  eventAppNotes: string | null;
  
  // Additional extracted info
  notes: string | null;
  
  // Confidence and source
  confidence: 'high' | 'medium' | 'low';
  extractedFields: string[];  // List of fields that were found
}

const EXTRACTION_PROMPT = `You are an expert at extracting trade show and exhibition information from documents. Extract EVERY piece of information you can find.

Analyze the following document and extract all trade show details. Return a JSON object with these fields:

{
  // BASIC INFO
  "name": "Show/event name",
  "location": "City, State/Country",
  "startDate": "YYYY-MM-DD (first day of show floor)",
  "endDate": "YYYY-MM-DD (last day of show floor)",
  "boothNumber": "Booth/stand number",
  "boothSize": "Dimensions (e.g., '10x10', '20x20')",
  "cost": numeric (booth/exhibit space cost, no currency symbols),
  "attendeesIncluded": numeric (number of badges/passes included),
  "managementCompany": "Show management/organizer company name",

  // EVENT TYPE
  "eventType": "in_person" | "virtual" | "hybrid",
  "virtualPlatform": "Platform name (e.g., Hopin, vFairs)",
  "virtualPlatformUrl": "URL to virtual platform",
  "virtualBoothUrl": "URL to your virtual booth",

  // VENUE
  "venueName": "Convention center/venue name",
  "venueAddress": "Full street address of venue",

  // MOVE-IN/MOVE-OUT (setup and teardown)
  "moveInDate": "YYYY-MM-DD (exhibitor setup day)",
  "moveInTime": "Time window (e.g., '8:00 AM - 5:00 PM')",
  "moveOutDate": "YYYY-MM-DD (teardown day)",
  "moveOutTime": "Time window (e.g., '3:00 PM - 8:00 PM')",

  // DEADLINES
  "earlyBirdDeadline": "YYYY-MM-DD",
  "registrationDeadline": "YYYY-MM-DD",
  "housingDeadline": "YYYY-MM-DD (hotel block cutoff)",
  "serviceKitDeadline": "YYYY-MM-DD (exhibitor kit/services order deadline)",
  "shippingDeadline": "YYYY-MM-DD (advance warehouse receipt deadline)",
  "shippingCutoff": "YYYY-MM-DD (direct-to-site shipping cutoff)",

  // CONTACTS
  "showContactName": "Primary contact name",
  "showContactEmail": "Contact email",
  "showContactPhone": "Contact phone",

  // URLS & PORTALS
  "showWebsite": "Official show website",
  "showAgendaUrl": "URL to agenda/schedule",
  "eventPortalUrl": "Exhibitor portal/dashboard URL",

  // SHIPPING & LOGISTICS (format longer text as HTML with <p>, <ul>, <li>)
  "shippingInfo": "Shipping instructions, carrier requirements - format as HTML with lists for multiple items",
  "warehouseAddress": "Advance warehouse address",
  "shipToSite": true/false (direct-to-site shipping allowed),
  "shipToWarehouse": true/false (advance warehouse shipping available),

  // LEAD CAPTURE
  "leadCaptureSystem": "Official lead retrieval system (e.g., CompuSystems, Validar)",

  // SERVICES & COSTS
  "electricalCost": numeric (electrical/power cost),
  "laborCost": numeric (I&D labor cost),
  "internetCost": numeric (WiFi/internet cost),
  "standardServicesCost": numeric (drayage, material handling),
  "utilitiesDetails": "Electrical/plumbing/compressed air details",
  "laborDetails": "Labor/I&D requirements and notes",

  // SPEAKING & SPONSORSHIP
  "hasSpeakingEngagement": true/false,
  "speakingDetails": "Session title, time, room",
  "sponsorshipDetails": "Sponsorship package details",

  // HOTEL
  "hotelName": "Official/recommended hotel name",
  "hotelAddress": "Hotel address",
  "hotelCostPerNight": numeric (room rate),

  // EVENT APP
  "hasEventApp": true/false,
  "eventAppNotes": "App name, download instructions",

  // CATCH-ALL (format as HTML with <p>, <ul>, <li> for readability)
  "notes": "Any other important details not captured above, formatted as clean HTML with paragraphs and lists",

  // META
  "confidence": "high" | "medium" | "low",
  "extractedFields": ["list", "of", "fields", "you", "found"]
}

Rules:
1. Return ONLY valid JSON, no other text or markdown
2. Use null for fields you cannot find
3. Convert all dates to YYYY-MM-DD format
4. For costs, extract numeric values only (e.g., "$5,000" → 5000)
5. If year is not specified, assume the next occurrence
6. Move-in is typically 1-2 days before show start; move-out is typically show end day or day after
7. Look for terms like: "installation", "setup", "dismantling", "teardown", "move-in", "move-out", "exhibitor access"
8. Set confidence:
   - high: Found name + dates + location + at least 5 other fields
   - medium: Found name + dates OR name + 3+ other fields
   - low: Limited information
9. List ALL fields you found in extractedFields

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

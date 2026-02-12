import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Sanitize user input to prevent prompt injection
function sanitizePrompt(text: string): string {
  let sanitized = text;
  
  // Remove attempts to break out of context
  sanitized = sanitized.replace(/```/g, '');
  
  // Remove common injection patterns
  const injectionPatterns = [
    /ignore\s+(previous|above|all)\s+(instructions?|prompts?)/gi,
    /disregard\s+(previous|above|all)/gi,
    /new\s+instructions?:/gi,
    /system\s*:/gi,
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
    const rateLimitKey = `ai:${user.id}`;
    const { data: rateLimitOk, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_key: rateLimitKey,
        p_limit: 20,
        p_window_seconds: 60
      });

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
      // Fall through - don't block on rate limit errors
    } else if (rateLimitOk === false) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt, systemPrompt, orgId } = body;

    if (!prompt || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, orgId' },
        { status: 400 }
      );
    }

    // Get API key from database (decrypted via view)
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

    // Initialize Anthropic client with org's API key
    const anthropic = new Anthropic({
      apiKey: aiSettings.ai_api_key,
    });

    // Sanitize user prompt to prevent injection
    const sanitizedPrompt = sanitizePrompt(prompt);

    // Make the API call
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt || 'You are a helpful assistant for trade show management.',
      messages: [
        { role: 'user', content: sanitizedPrompt }
      ],
    });

    // Extract text response
    const textContent = message.content.find(c => c.type === 'text');
    const responseText = textContent ? textContent.text : '';

    return NextResponse.json({
      success: true,
      response: responseText,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });

  } catch (error) {
    console.error('AI generation error:', error);
    
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your settings.' },
          { status: 400 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}

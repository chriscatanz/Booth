import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Make the API call
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt || 'You are a helpful assistant for trade show management.',
      messages: [
        { role: 'user', content: prompt }
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Allowed MIME types for different upload contexts
const ALLOWED_TYPES = {
  logo: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
};

// Max file sizes (in bytes)
const MAX_SIZES = {
  logo: 2 * 1024 * 1024,      // 2MB
  document: 10 * 1024 * 1024,  // 10MB
  image: 5 * 1024 * 1024,      // 5MB
};

// Magic bytes for file type detection
const MAGIC_BYTES: Record<string, number[]> = {
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
};

function detectFileType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);
  
  for (const [mimeType, magic] of Object.entries(MAGIC_BYTES)) {
    if (magic.every((byte, index) => bytes[index] === byte)) {
      return mimeType;
    }
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Database-based rate limiting
    const rateLimitKey = `upload:${user.id}`;
    const { data: rateLimitOk, error: rateLimitError } = await supabase
      .rpc('check_rate_limit', {
        p_key: rateLimitKey,
        p_limit: 30,  // 30 uploads per minute
        p_window_seconds: 60
      });

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
    } else if (rateLimitOk === false) {
      return NextResponse.json(
        { error: 'Too many uploads. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as 'logo' | 'document' | 'image' | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!context || !ALLOWED_TYPES[context]) {
      return NextResponse.json({ error: 'Invalid upload context' }, { status: 400 });
    }

    // Check file size
    const maxSize = MAX_SIZES[context];
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Check MIME type from file header
    const allowedTypes = ALLOWED_TYPES[context];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify actual file content matches claimed type (magic bytes check)
    const buffer = await file.arrayBuffer();
    const detectedType = detectFileType(buffer);
    
    // For images, verify magic bytes match
    if (detectedType && !allowedTypes.includes(detectedType)) {
      return NextResponse.json(
        { error: 'File content does not match declared type' },
        { status: 400 }
      );
    }

    // Check for potentially dangerous content in SVG files
    if (file.type === 'image/svg+xml') {
      const text = await file.text();
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i, // onclick, onerror, onload, etc.
        /<iframe/i,
        /<embed/i,
        /<object/i,
        /<foreignObject/i,
        /<use[^>]+href\s*=\s*["'][^"'#]/i, // external use references
        /xlink:href\s*=\s*["'](?!#)/i, // external xlink references
        /data:/i, // data URIs can contain scripts
        /<meta/i,
        /<link/i,
        /<base/i,
        /<!--.*-->/s, // HTML comments can hide attacks
        /&#x?[0-9a-f]+;/i, // HTML entities (potential encoding bypass)
        /\\u[0-9a-f]{4}/i, // Unicode escapes
        /expression\s*\(/i, // CSS expression (IE)
        /url\s*\(\s*["']?\s*javascript/i, // CSS url() with javascript
      ];
      
      if (dangerousPatterns.some(pattern => pattern.test(text))) {
        return NextResponse.json(
          { error: 'SVG contains potentially dangerous content' },
          { status: 400 }
        );
      }
    }

    // File passed all validation checks
    return NextResponse.json({ 
      valid: true,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('File validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate file' },
      { status: 500 }
    );
  }
}

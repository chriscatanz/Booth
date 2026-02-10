import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Dynamic import for Node.js modules (they don't work at the edge)
export const runtime = 'nodejs';

// Supported file types
const SUPPORTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/rtf',
  'application/rtf',
  'text/markdown',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Process each file
    const results: { filename: string; text: string; error?: string }[] = [];

    for (const file of files) {
      // Size check
      if (file.size > MAX_FILE_SIZE) {
        results.push({
          filename: file.name,
          text: '',
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        });
        continue;
      }

      // Type check
      const fileType = file.type || getMimeFromExtension(file.name);
      if (!SUPPORTED_TYPES.includes(fileType) && !isTextFile(file.name)) {
        results.push({
          filename: file.name,
          text: '',
          error: `Unsupported file type: ${fileType || 'unknown'}`,
        });
        continue;
      }

      try {
        const text = await parseDocument(file, fileType);
        results.push({ filename: file.name, text });
      } catch (err) {
        results.push({
          filename: file.name,
          text: '',
          error: err instanceof Error ? err.message : 'Failed to parse file',
        });
      }
    }

    return NextResponse.json({
      success: true,
      documents: results,
    });
  } catch (error) {
    console.error('Document parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse documents' },
      { status: 500 }
    );
  }
}

function getMimeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'rtf': 'text/rtf',
    'md': 'text/markdown',
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
}

function isTextFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ['txt', 'md', 'rtf', 'text'].includes(ext || '');
}

async function parseDocument(file: File, mimeType: string): Promise<string> {
  const buffer = await file.arrayBuffer();
  const nodeBuffer = Buffer.from(buffer);

  // PDF files
  if (mimeType === 'application/pdf') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(nodeBuffer);
    return data.text;
  }

  // DOCX files
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer: nodeBuffer });
    return result.value;
  }

  // DOC files (older format) - try mammoth, fallback to raw text extraction
  if (mimeType === 'application/msword') {
    try {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: nodeBuffer });
      return result.value;
    } catch {
      // Fallback: extract readable text from binary
      return extractTextFromBinary(nodeBuffer);
    }
  }

  // RTF files
  if (mimeType === 'text/rtf' || mimeType === 'application/rtf') {
    return parseRTF(nodeBuffer.toString('latin1'));
  }

  // Plain text / Markdown
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return nodeBuffer.toString('utf-8');
  }

  // Fallback: try to read as text
  return nodeBuffer.toString('utf-8');
}

// Simple RTF parser - strips RTF control words and returns plain text
function parseRTF(rtfContent: string): string {
  let text = rtfContent;
  
  // Remove RTF header (use [\s\S] instead of 's' flag for compatibility)
  text = text.replace(/^\{\\rtf1[\s\S]*?\\viewkind4/, '');
  
  // Handle Unicode characters
  text = text.replace(/\\u(\d+)\?/g, (_, code) => String.fromCharCode(parseInt(code)));
  
  // Remove RTF control words
  text = text.replace(/\\[a-z]+\d* ?/gi, '');
  
  // Remove group braces
  text = text.replace(/[{}]/g, '');
  
  // Convert special characters
  text = text.replace(/\\'([0-9a-f]{2})/gi, (_, hex) => 
    String.fromCharCode(parseInt(hex, 16))
  );
  
  // Clean up whitespace
  text = text.replace(/\r\n|\r/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.trim();
  
  return text;
}

// Extract readable text from binary formats (fallback)
function extractTextFromBinary(buffer: Buffer): string {
  // Look for sequences of printable ASCII characters
  const text = buffer.toString('latin1');
  const readable = text.match(/[\x20-\x7E\n\r\t]{10,}/g);
  return readable ? readable.join('\n') : '';
}

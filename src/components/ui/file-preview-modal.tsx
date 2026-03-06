'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, Download, Loader2, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface FilePreviewModalProps {
  filePath: string;    // Supabase storage path
  fileName: string;
  fileType: string | null;
  onClose: () => void;
}

function getPreviewKind(fileType: string | null, fileName: string): 'pdf' | 'image' | 'none' {
  const mime = (fileType ?? '').toLowerCase();
  const ext  = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return 'image';
  return 'none';
}

export function FilePreviewModal({ filePath, fileName, fileType, onClose }: FilePreviewModalProps) {
  const [url,     setUrl]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const kind = getPreviewKind(fileType, fileName);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!supabase) throw new Error('No Supabase client');
      const bucket = filePath.startsWith('uploads/') || !filePath.includes('/') ? 'uploads' : 'show-files';
      const { data, error: err } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 300); // 5-min URL
      if (err) throw err;
      setUrl(data.signedUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDownload = async () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col bg-bg-primary rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '100%', maxWidth: 900, maxHeight: '92vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-primary flex-shrink-0">
          <FileText size={18} className="text-brand-purple flex-shrink-0" />
          <span className="text-sm font-medium text-text-primary truncate flex-1">{fileName}</span>
          <button
            onClick={handleDownload}
            disabled={!url}
            title="Download"
            className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden min-h-0 flex items-center justify-center bg-bg-secondary">
          {loading && (
            <Loader2 size={32} className="animate-spin text-brand-purple" />
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 text-center p-8">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-sm text-text-secondary">{error}</p>
              <button onClick={load} className="text-sm text-brand-purple hover:underline">Retry</button>
            </div>
          )}

          {!loading && !error && url && kind === 'pdf' && (
            <iframe
              src={url}
              title={fileName}
              className="w-full h-full border-0"
              style={{ minHeight: '70vh' }}
            />
          )}

          {!loading && !error && url && kind === 'image' && (
            <img
              src={url}
              alt={fileName}
              className="max-w-full max-h-full object-contain p-4"
              style={{ maxHeight: '80vh' }}
            />
          )}

          {!loading && !error && url && kind === 'none' && (
            <div className="flex flex-col items-center gap-4 text-center p-8">
              <FileText size={48} className="text-text-tertiary" />
              <div>
                <p className="text-sm font-medium text-text-primary mb-1">{fileName}</p>
                <p className="text-xs text-text-tertiary mb-4">Preview not available for this file type</p>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Download size={14} /> Download File
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

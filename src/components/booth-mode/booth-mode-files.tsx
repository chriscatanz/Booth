'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Loader2, FolderOpen } from 'lucide-react';
import { fetchAdditionalFiles } from '@/services/supabase-service';
import { useToastStore } from '@/store/toast-store';
import { AdditionalFile } from '@/types';
import { format, parseISO } from 'date-fns';
import { FilePreviewModal } from '@/components/ui/file-preview-modal';

interface BoothModeFilesProps {
  showId: number;
}

export function BoothModeFiles({ showId }: BoothModeFilesProps) {
  const toast = useToastStore();
  const [files, setFiles] = useState<AdditionalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<AdditionalFile | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAdditionalFiles(showId);
        setFiles(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load files';
        toast.error('Error', msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showId, toast]);

  // suppress unused toast warning — still used in load()
  void toast;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <FolderOpen size={32} className="text-white/20 mb-3" />
        <p className="text-white/50 text-sm">No files for this show</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-2">
        {files.map(file => (
          <button
            key={file.localId}
            onClick={() => setPreviewFile(file)}
            className="w-full rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-3 text-left hover:bg-white/10 transition-colors"
          >
            <div className="p-2 rounded-lg bg-white/10 flex-shrink-0">
              <FileText size={18} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{file.fileName}</p>
              <p className="text-xs text-white/40 mt-0.5">
                {file.fileType ?? 'File'}
                {file.uploadedAt && ` · ${format(parseISO(file.uploadedAt), 'MMM d, yyyy')}`}
              </p>
            </div>
            <span className="text-xs text-white/30 flex-shrink-0">Preview</span>
          </button>
        ))}
      </div>

      {previewFile && (
        <FilePreviewModal
          filePath={previewFile.filePath}
          fileName={previewFile.fileName}
          fileType={previewFile.fileType}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  );
}

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Loader2, Trash2, ExternalLink, Eye, Shield, Lock } from 'lucide-react';
import { AdditionalFile, DocumentVisibility } from '@/types';
import { cn } from '@/lib/utils';
import * as api from '@/services/supabase-service';

interface FileUploadZoneProps {
  tradeshowId: number;
  files: AdditionalFile[];
  onFilesChange: () => void;
  disabled?: boolean;
}

const visibilityOptions: { value: DocumentVisibility; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'all', label: 'Everyone', icon: <Eye size={14} />, desc: 'All team members' },
  { value: 'editors', label: 'Editors+', icon: <Shield size={14} />, desc: 'Editors, admins, owners' },
  { value: 'admins', label: 'Admins Only', icon: <Lock size={14} />, desc: 'Admins and owners only' },
];

export function FileUploadZone({ tradeshowId, files, onFilesChange, disabled }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadVisibility, setUploadVisibility] = useState<DocumentVisibility>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return;

    setIsUploading(true);
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadProgress(`Uploading ${file.name}...`);
      
      try {
        // Upload to storage
        const publicUrl = await api.uploadFile(file);
        
        // Create record in database with visibility
        await api.createAdditionalFile({
          dbId: null,
          tradeshowId,
          fileName: file.name,
          filePath: publicUrl,
          fileType: file.type || 'application/octet-stream',
          uploadedAt: null,
          localId: crypto.randomUUID(),
          visibility: uploadVisibility,
        });
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
    
    setIsUploading(false);
    setUploadProgress(null);
    onFilesChange();
  }, [tradeshowId, disabled, onFilesChange, uploadVisibility]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDelete = async (file: AdditionalFile) => {
    if (!file.dbId) return;
    if (!confirm(`Delete "${file.fileName}"?`)) return;
    
    try {
      // Delete from storage
      if (file.filePath) {
        await api.deleteFile(file.filePath);
      }
      // Delete from database
      await api.deleteAdditionalFile(file.dbId);
      onFilesChange();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return '📄';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    return '📄';
  };

  return (
    <div className="space-y-3">
      {/* Visibility selector */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Visibility:</span>
          <div className="flex gap-1">
            {visibilityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setUploadVisibility(opt.value)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                  uploadVisibility === opt.value
                    ? 'bg-brand-purple text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                )}
                title={opt.desc}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragging && 'border-brand-purple bg-brand-purple/5',
          !isDragging && 'border-border hover:border-brand-purple/50 hover:bg-bg-tertiary',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="text-brand-purple animate-spin" />
            <p className="text-sm text-text-secondary">{uploadProgress}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={24} className="text-text-tertiary" />
            <p className="text-sm text-text-secondary">
              Drop files here or <span className="text-brand-purple">browse</span>
            </p>
            <p className="text-xs text-text-tertiary">
              Contracts, receipts, floor plans, etc.
            </p>
          </div>
        )}
      </div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            {files.map((file) => (
              <motion.div
                key={file.localId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-bg-tertiary group"
              >
                <span className="text-lg">{getFileIcon(file.fileType)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary truncate">{file.fileName}</p>
                    {file.visibility && file.visibility !== 'all' && (
                      <span className={cn(
                        'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium',
                        file.visibility === 'admins' && 'bg-warning/20 text-warning',
                        file.visibility === 'editors' && 'bg-brand-cyan/20 text-brand-cyan',
                      )}>
                        {file.visibility === 'admins' ? <Lock size={10} /> : <Shield size={10} />}
                        {file.visibility === 'admins' ? 'Admin' : 'Editor+'}
                      </span>
                    )}
                  </div>
                  {file.uploadedAt && (
                    <p className="text-xs text-text-tertiary">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <a
                  href={file.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleDelete(file)}
                  className="p-1.5 rounded hover:bg-error/10 text-text-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

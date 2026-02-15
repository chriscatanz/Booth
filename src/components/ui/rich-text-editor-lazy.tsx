'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading skeleton for the rich text editor
function RichTextEditorSkeleton({ minHeight = '120px' }: { minHeight?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="rounded-lg border border-border bg-bg-secondary overflow-hidden">
        {/* Toolbar skeleton */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border-subtle bg-bg-secondary">
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-7 h-7 rounded bg-bg-tertiary animate-pulse" />
            ))}
          </div>
          <div className="w-px h-5 bg-border-subtle mx-1" />
          <div className="flex gap-1">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="w-7 h-7 rounded bg-bg-tertiary animate-pulse" />
            ))}
          </div>
        </div>
        {/* Editor area skeleton */}
        <div 
          className="flex items-center justify-center px-3 py-2" 
          style={{ minHeight }}
        >
          <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
        </div>
      </div>
    </div>
  );
}

// Dynamically import the RichTextEditor to reduce initial bundle
export const LazyRichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor').then((mod) => mod.RichTextEditor),
  { 
    ssr: false, 
    loading: () => <RichTextEditorSkeleton />
  }
);

// Also export a lazy version of RichTextDisplay (lighter, but still has DOMPurify)
export const LazyRichTextDisplay = dynamic(
  () => import('@/components/ui/rich-text-editor').then((mod) => mod.RichTextDisplay),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-bg-tertiary rounded h-4 w-full" />
    )
  }
);

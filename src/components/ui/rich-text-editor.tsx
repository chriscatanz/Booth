'use client';

import React, { useMemo } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Minus,
} from 'lucide-react';

interface RichTextEditorProps {
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive 
          ? 'bg-brand-purple text-white' 
          : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >
      {children}
    </motion.button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border-subtle mx-1" />;
}

interface MenuBarProps {
  editor: Editor | null;
}

function MenuBar({ editor }: MenuBarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border-subtle bg-bg-secondary rounded-t-lg flex-wrap">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough size={14} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <ListOrdered size={14} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus size={14} />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <Undo size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <Redo size={14} />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false, // Keep it simple for notes
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Return empty string if editor only has empty paragraph
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none',
          'px-3 py-2',
          '[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_blockquote]:my-2',
          '[&_blockquote]:border-l-2 [&_blockquote]:border-brand-purple [&_blockquote]:pl-3 [&_blockquote]:italic',
          '[&_ul]:list-disc [&_ul]:pl-5',
          '[&_ol]:list-decimal [&_ol]:pl-5',
          '[&_li]:my-0.5',
          '[&_hr]:my-3 [&_hr]:border-border-subtle'
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync external value changes
  React.useEffect(() => {
    if (editor && value !== editor.getHTML() && value !== (editor.getHTML() === '<p></p>' ? '' : editor.getHTML())) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-xs font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="rounded-lg border border-border bg-bg-secondary overflow-hidden focus-within:ring-2 focus-within:ring-brand-purple/40 focus-within:border-brand-purple transition-all">
        <MenuBar editor={editor} />
        <EditorContent 
          editor={editor} 
          className="text-sm text-text-primary [&_.is-editor-empty:first-child::before]:text-text-tertiary [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none"
        />
      </div>
      <p className="text-[10px] text-text-tertiary">
        Supports <strong>bold</strong>, <em>italic</em>, lists, and more. Use keyboard shortcuts like Ctrl+B.
      </p>
    </div>
  );
}

// Simple display component for rendering HTML content (with XSS protection)
export function RichTextDisplay({ content, className }: { content: string | null; className?: string }) {
  // Sanitize HTML to prevent XSS attacks
  const sanitizedContent = useMemo(() => {
    if (!content) return null;
    
    // Configure DOMPurify to allow only safe formatting tags
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'ul', 'ol', 'li', 'blockquote', 'hr'],
      ALLOWED_ATTR: [], // No attributes allowed (prevents onclick, onerror, etc.)
    });
  }, [content]);

  if (!sanitizedContent) return null;

  return (
    <div 
      className={cn(
        'prose prose-sm max-w-none text-text-primary',
        '[&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_blockquote]:my-2',
        '[&_blockquote]:border-l-2 [&_blockquote]:border-brand-purple [&_blockquote]:pl-3 [&_blockquote]:italic',
        '[&_ul]:list-disc [&_ul]:pl-5',
        '[&_ol]:list-decimal [&_ol]:pl-5',
        '[&_li]:my-0.5',
        '[&_hr]:my-3 [&_hr]:border-border-subtle',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

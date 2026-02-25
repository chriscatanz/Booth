'use client';

/**
 * NameInputModal — lightweight single-field modal to replace browser prompt() calls.
 * Renders via portal, auto-focuses the input, supports Enter/Escape shortcuts.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

interface NameInputModalProps {
  isOpen: boolean;
  title: string;
  label?: string;
  placeholder?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function NameInputModal({
  isOpen,
  title,
  label,
  placeholder,
  onConfirm,
  onCancel,
}: NameInputModalProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value and auto-focus whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setValue('');
      // Small delay so the portal has mounted before we focus
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter' && value.trim()) {
        e.preventDefault();
        handleConfirm();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, value]);

  function handleConfirm() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
    setValue('');
  }

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="name-input-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            id="name-input-modal-title"
            className="text-base font-semibold text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input */}
        <Input
          ref={inputRef}
          label={label}
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={!value.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

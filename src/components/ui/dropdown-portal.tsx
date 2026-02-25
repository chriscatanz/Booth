'use client';

/**
 * DropdownPortal — renders dropdown content in document.body via a portal,
 * escaping any parent overflow:hidden or stacking context.
 *
 * Usage:
 *   const triggerRef = useRef<HTMLElement>(null);
 *   const dropdownRef = useRef<HTMLDivElement>(null);
 *   <DropdownPortal isOpen={isOpen} triggerRef={triggerRef} dropdownRef={dropdownRef} onClose={() => setIsOpen(false)}>
 *     <div>dropdown content</div>
 *   </DropdownPortal>
 */

import { useEffect, useRef, useState, RefObject } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  dropdownRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownPortal({
  isOpen,
  triggerRef,
  dropdownRef,
  onClose,
  children,
  align = 'left',
  className = '',
}: DropdownPortalProps) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  // Recalculate position whenever it opens
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: align === 'right' ? undefined : rect.left,
      right: align === 'right' ? window.innerWidth - rect.right : undefined,
      minWidth: rect.width,
      zIndex: 9999,
    });
  }, [isOpen, triggerRef, align]);

  // Close on click outside (both trigger and dropdown)
  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, triggerRef, dropdownRef, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={dropdownRef} style={style} className={className}>
      {children}
    </div>,
    document.body
  );
}

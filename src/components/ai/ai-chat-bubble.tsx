'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIChatWidget } from './ai-chat-widget';
import { useAuthStore } from '@/store/auth-store';

interface AIChatBubbleProps {
  className?: string;
}

export function AIChatBubble({ className }: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const user = useAuthStore((s) => s.user);

  // Don't show if not authenticated
  if (!user) return null;

  return (
    <>
      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <AIChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <div className={cn('fixed bottom-6 right-6 z-40', className)}>
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
            >
              <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
                <p className="text-sm font-medium text-text-primary">AI Assistant</p>
                <p className="text-xs text-text-tertiary">Ask me anything</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'w-14 h-14 rounded-full shadow-lg',
            'bg-gradient-to-br from-purple-500 to-indigo-600',
            'flex items-center justify-center',
            'text-white',
            'hover:shadow-xl hover:shadow-purple-500/25',
            'transition-shadow duration-200',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-bg-primary',
            'touch-manipulation',
            'relative'
          )}
          aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <MessageSquare size={24} />
                <Sparkles 
                  size={12} 
                  className="absolute -top-1 -right-1 text-yellow-300" 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse animation ring - only when closed */}
          {!isOpen && (
            <span 
              className="absolute inset-0 rounded-full animate-ping bg-purple-500/30 pointer-events-none" 
              style={{ animationDuration: '3s' }} 
            />
          )}
        </motion.button>
      </div>
    </>
  );
}

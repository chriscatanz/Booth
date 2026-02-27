'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import DOMPurify from 'dompurify';
import { TradeShow } from '@/types';

interface BoothModeAgendaProps {
  show: TradeShow;
}

const sanitizeHtml = (html: string | null) => {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'hr', 'h1', 'h2', 'h3', 'h4'],
    ALLOWED_ATTR: [],
  });
};

export function BoothModeAgenda({ show }: BoothModeAgendaProps) {
  const sanitizedAgenda = useMemo(() => sanitizeHtml(show.agendaContent), [show.agendaContent]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="p-4 space-y-4"
    >
      {show.agendaContent ? (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div
            className="prose prose-invert prose-sm max-w-none text-white/80"
            dangerouslySetInnerHTML={{ __html: sanitizedAgenda }}
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
          <Calendar size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No agenda added yet</p>
        </div>
      )}
    </motion.div>
  );
}

'use client';

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  className?: string;
  delay?: number;
}

// Animated counter for numbers
function AnimatedValue({ value, delay = 0 }: { value: string; delay?: number }) {
  const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
  const isNumeric = !isNaN(numericValue);
  const prefix = value.match(/^[^0-9]*/)?.[0] || '';
  const suffix = value.match(/[^0-9]*$/)?.[0] || '';
  
  const spring = useSpring(0, { 
    stiffness: 75, 
    damping: 15,
  });
  
  const display = useTransform(spring, (current) => {
    if (!isNumeric) return value;
    if (value.includes('.')) {
      return `${prefix}${current.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`;
    }
    return `${prefix}${Math.round(current).toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    if (isNumeric) {
      // Use timeout to handle delay since useSpring doesn't support it
      const timeout = setTimeout(() => {
        spring.set(numericValue);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [numericValue, spring, isNumeric, delay]);

  if (!isNumeric) {
    return <span>{value}</span>;
  }

  return <motion.span>{display}</motion.span>;
}

export function StatCard({ title, value, subtitle, icon: Icon, color, className, delay = 0 }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        delay: delay * 0.1 
      }}
      whileHover={{ 
        y: -4, 
        boxShadow: `0 12px 40px ${color}20`,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      }}
      className={cn(
        'relative flex flex-col gap-3 p-4 rounded-xl bg-surface border border-border-subtle shadow-sm flex-1 cursor-default overflow-hidden group',
        className
      )}
    >
      {/* Gradient background accent */}
      <div 
        className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 60%)` }}
      />
      {/* Subtle top border accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] opacity-60"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />
      <div className="relative flex items-center gap-2">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 15,
            delay: delay * 0.1 + 0.1
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="flex items-center justify-center w-11 h-11 rounded-xl shadow-sm"
          style={{ 
            backgroundColor: `${color}15`,
            boxShadow: `0 4px 12px ${color}20`
          }}
        >
          <Icon size={22} style={{ color }} />
        </motion.div>
      </div>
      <div className="relative">
        <motion.p 
          className="text-2xl font-bold text-text-primary tracking-tight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay * 0.1 + 0.2 }}
        >
          <AnimatedValue value={value} delay={delay * 0.1 + 0.3} />
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay * 0.1 + 0.25 }}
          className="text-xs font-semibold text-text-secondary uppercase tracking-wide"
        >
          {title}
        </motion.p>
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay * 0.1 + 0.3 }}
            className="text-xs mt-1 font-medium" 
            style={{ color }}
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

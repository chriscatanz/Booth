'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pageVariants, pageTransition, staggerItem } from '@/lib/animations';

// Wrapper for page-level transitions
export function PageTransition({ 
  children,
  key,
  className
}: { 
  children: React.ReactNode;
  key: string;
  className?: string;
}) {
  return (
    <motion.div
      key={key}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Container that staggers its children
export function StaggerContainer({ 
  children,
  className,
  delay = 0
}: { 
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: 0.05,
            delayChildren: delay,
          },
        },
      }}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Item within a stagger container
export function StaggerItem({ 
  children,
  className
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in on scroll
export function FadeInWhenVisible({ 
  children,
  className,
  delay = 0
}: { 
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25,
        delay
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated presence wrapper
export function AnimatedPresenceWrapper({ 
  children,
  mode = 'wait'
}: { 
  children: React.ReactNode;
  mode?: 'wait' | 'sync' | 'popLayout';
}) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
}

// Hover scale effect
export function HoverScale({ 
  children,
  scale = 1.02,
  className
}: { 
  children: React.ReactNode;
  scale?: number;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

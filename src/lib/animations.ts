'use client';

import { Variants } from 'framer-motion';

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
};

// Fade in variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Slide up variants
export const slideUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 24 },
};

// Scale variants (for cards, modals)
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Stagger children container
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Stagger item
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
};

// List item (for sidebar)
export const listItem: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  exit: { opacity: 0, x: -16 },
};

// Card hover
export const cardHover = {
  rest: { scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  hover: { 
    scale: 1.02, 
    boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.98 },
};

// Accordion/collapse
export const accordion: Variants = {
  collapsed: { height: 0, opacity: 0 },
  expanded: { 
    height: 'auto', 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
};

// Stat counter animation config
export const counterSpring = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 15,
};

// Sidebar show item
export const sidebarItem: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  },
  exit: { 
    opacity: 0, 
    x: -8,
    transition: { duration: 0.15 }
  },
};

// Button press
export const buttonPress = {
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};

// Notification slide in
export const notification: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    scale: 0.95,
    transition: { duration: 0.2 }
  },
};

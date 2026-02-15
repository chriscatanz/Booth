'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  color: string;
  startX: number;
  startY: number;
  rotation: number;
  scale: number;
  delay: number;
}

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  intensity?: 'light' | 'medium' | 'heavy';
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#8B5CF6', // brand purple
  '#10B981', // success green
  '#F59E0B', // warning amber
  '#EF4444', // error red
  '#3B82F6', // primary blue
  '#EC4899', // pink
];

const INTENSITY_SETTINGS = {
  light: { count: 30, spread: 60 },
  medium: { count: 50, spread: 80 },
  heavy: { count: 80, spread: 100 },
};

export function Confetti({ 
  show, 
  onComplete,
  duration = 3000,
  intensity = 'medium',
  colors = DEFAULT_COLORS 
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const settings = INTENSITY_SETTINGS[intensity];

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      const newPieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < settings.count; i++) {
        newPieces.push({
          id: i,
          color: colors[Math.floor(Math.random() * colors.length)],
          startX: Math.random() * 100, // percentage
          startY: Math.random() * 20, // start from top 20%
          rotation: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.8, // 0.5 to 1.3
          delay: Math.random() * 0.5, // 0 to 500ms delay
        });
      }
      
      setPieces(newPieces);
      
      // Auto-complete after duration
      if (onComplete) {
        const timer = setTimeout(onComplete, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setPieces([]);
    }
  }, [show, settings.count, colors, duration, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {show && pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              x: `${piece.startX}vw`,
              y: `${piece.startY}vh`,
              rotate: piece.rotation,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: `${piece.startX + (Math.random() - 0.5) * settings.spread}vw`,
              y: '100vh',
              rotate: piece.rotation + 720, // 2 full rotations
              scale: piece.scale,
              opacity: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: duration / 1000,
              delay: piece.delay,
              ease: [0.23, 1, 0.32, 1], // Custom cubic-bezier for natural fall
            }}
            className="absolute w-2 h-2 pointer-events-none"
          >
            {/* Square confetti piece */}
            <div
              className="w-full h-full"
              style={{ backgroundColor: piece.color }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Simple hook for triggering confetti
export function useConfetti() {
  const [showConfetti, setShowConfetti] = useState(false);

  const trigger = (options?: { 
    duration?: number; 
    intensity?: 'light' | 'medium' | 'heavy';
    colors?: string[];
  }) => {
    setShowConfetti(true);
    
    // Auto-hide after duration
    const duration = options?.duration || 3000;
    setTimeout(() => setShowConfetti(false), duration);
  };

  const hide = () => setShowConfetti(false);

  return {
    showConfetti,
    trigger,
    hide,
    Confetti: (props: Omit<ConfettiProps, 'show'>) => (
      <Confetti show={showConfetti} {...props} />
    ),
  };
}

// Preset configurations for different celebration types
export const ConfettiPresets = {
  success: {
    intensity: 'medium' as const,
    colors: ['#10B981', '#059669', '#34D399', '#6EE7B7'],
    duration: 2500,
  },
  celebration: {
    intensity: 'heavy' as const,
    colors: DEFAULT_COLORS,
    duration: 3500,
  },
  milestone: {
    intensity: 'medium' as const,
    colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
    duration: 3000,
  },
  subtle: {
    intensity: 'light' as const,
    colors: ['#8B5CF6', '#10B981'],
    duration: 2000,
  },
} as const;
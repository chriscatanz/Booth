'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function validatePassword(password: string): { valid: boolean; score: number; errors: string[] } {
  const errors: string[] = [];
  let score = 0;

  requirements.forEach((req) => {
    if (req.test(password)) {
      score++;
    } else {
      errors.push(req.label);
    }
  });

  return {
    valid: score >= 4, // Require at least 4 of 5 criteria (all except special char)
    score,
    errors,
  };
}

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const { score, valid } = useMemo(() => validatePassword(password), [password]);

  const getStrengthLabel = () => {
    if (password.length === 0) return '';
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    if (score === 4) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = () => {
    if (score <= 1) return 'bg-error';
    if (score === 2) return 'bg-warning';
    if (score === 3) return 'bg-info';
    if (score >= 4) return 'bg-success';
    return 'bg-border';
  };

  if (password.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3"
    >
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary">Password strength</span>
          <span className={cn(
            'text-xs font-medium',
            score <= 1 && 'text-error',
            score === 2 && 'text-warning',
            score === 3 && 'text-info',
            score >= 4 && 'text-success',
          )}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <motion.div
              key={level}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: score >= level ? 1 : 1 }}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-200',
                score >= level ? getStrengthColor() : 'bg-border-subtle'
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      {showRequirements && (
        <div className="grid grid-cols-1 gap-1">
          {requirements.map((req, i) => {
            const met = req.test(password);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2"
              >
                {met ? (
                  <Check size={12} className="text-success" />
                ) : (
                  <X size={12} className="text-text-tertiary" />
                )}
                <span className={cn(
                  'text-xs',
                  met ? 'text-success' : 'text-text-tertiary'
                )}>
                  {req.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

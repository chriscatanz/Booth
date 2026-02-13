'use client';

import { Download, Share, CheckCircle, Smartphone } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { useState } from 'react';

interface InstallButtonProps {
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function InstallButton({ className = '', variant = 'primary' }: InstallButtonProps) {
  const { canInstall, isInstalled, isIOS, isStandalone, install } = usePwaInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Already installed
  if (isInstalled || isStandalone) {
    return (
      <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500/20 text-green-400 ${className}`}>
        <CheckCircle className="w-5 h-5" />
        <span>App Installed</span>
      </div>
    );
  }

  // iOS - show instructions
  if (isIOS) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowIOSInstructions(!showIOSInstructions)}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            variant === 'primary'
              ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white hover:opacity-90'
              : 'bg-white/10 text-white hover:bg-white/20'
          } ${className}`}
        >
          <Smartphone className="w-5 h-5" />
          <span>Install App</span>
        </button>
        
        {showIOSInstructions && (
          <div className="absolute top-full left-0 mt-3 p-4 bg-surface-secondary rounded-xl border border-border shadow-xl z-50 w-72">
            <h4 className="font-semibold text-text-primary mb-3">Install on iOS</h4>
            <ol className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-pink/20 text-brand-pink text-xs flex items-center justify-center">1</span>
                <span>Tap the <Share className="inline w-4 h-4" /> Share button in Safari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-pink/20 text-brand-pink text-xs flex items-center justify-center">2</span>
                <span>Scroll down and tap &ldquo;Add to Home Screen&rdquo;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-pink/20 text-brand-pink text-xs flex items-center justify-center">3</span>
                <span>Tap &ldquo;Add&rdquo; to install</span>
              </li>
            </ol>
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="mt-3 text-xs text-text-tertiary hover:text-text-secondary"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }

  // Chrome/Edge/Android - native prompt
  if (canInstall) {
    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
          variant === 'primary'
            ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white hover:opacity-90'
            : 'bg-white/10 text-white hover:bg-white/20'
        } ${className}`}
      >
        <Download className="w-5 h-5" />
        <span>Install App</span>
      </button>
    );
  }

  // Fallback - browser doesn't support PWA install
  return (
    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white/70 ${className}`}>
      <Smartphone className="w-5 h-5" />
      <span>Use in Browser</span>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import { 
  LogOut, Building2, ChevronDown, Settings, Check, Zap, Shield,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  onOpenOrgSettings?: () => void;
  onEnterBoothMode?: () => void;
  canEnterBoothMode?: boolean;
}

export function UserMenu({ onOpenOrgSettings, onEnterBoothMode, canEnterBoothMode }: UserMenuProps) {
  const { 
    user, 
    organization, 
    organizations, 
    membership,
    switchOrganization, 
    signOut,
    isAdmin,
    isSuperAdmin,
  } = useAuthStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowOrgPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || user?.email?.[0]?.toUpperCase() || '?';

  const roleColors: Record<string, string> = {
    owner: 'bg-brand-purple text-white',
    admin: 'bg-brand-cyan text-white',
    editor: 'bg-success text-white',
    viewer: 'bg-text-tertiary text-white',
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-tertiary transition-colors"
      >
        {user?.avatarUrl ? (
          <Image 
            src={user.avatarUrl} 
            alt={user.fullName || 'User'} 
            width={28}
            height={28}
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-brand-purple flex items-center justify-center text-white text-xs font-medium">
            {initials}
          </div>
        )}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-text-primary leading-tight">
            {user?.fullName || user?.email}
          </p>
          <p className="text-[10px] text-text-tertiary leading-tight">
            {organization?.name}
          </p>
        </div>
        <ChevronDown size={14} className="text-text-tertiary" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl border border-border shadow-xl z-50 overflow-hidden"
          >
            {/* User info */}
            <div className="p-3 border-b border-border">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-text-secondary truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-error/20 text-error">
                    Super Admin
                  </span>
                )}
                {membership?.role && (
                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-medium capitalize',
                    roleColors[membership.role] || 'bg-bg-tertiary text-text-secondary'
                  )}>
                    {membership.role}
                  </span>
                )}
              </div>
            </div>

            {/* Organization */}
            <div className="p-2 border-b border-border">
              <button
                onClick={() => setShowOrgPicker(!showOrgPicker)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-tertiary text-left"
              >
                <Building2 size={14} className="text-text-tertiary" />
                <span className="flex-1 text-sm text-text-primary truncate">
                  {organization?.name || 'Select organization'}
                </span>
                <ChevronDown 
                  size={14} 
                  className={cn(
                    'text-text-tertiary transition-transform',
                    showOrgPicker && 'rotate-180'
                  )} 
                />
              </button>

              <AnimatePresence>
                {showOrgPicker && organizations.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 space-y-0.5 overflow-hidden"
                  >
                    {organizations.map((mem) => (
                      <button
                        key={mem.organizationId}
                        onClick={() => {
                          switchOrganization(mem.organizationId);
                          setShowOrgPicker(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm',
                          mem.organizationId === organization?.id
                            ? 'bg-brand-purple/10 text-brand-purple'
                            : 'hover:bg-bg-tertiary text-text-secondary'
                        )}
                      >
                        {mem.organizationId === organization?.id && (
                          <Check size={12} />
                        )}
                        <span className={cn(
                          'truncate',
                          mem.organizationId !== organization?.id && 'ml-5'
                        )}>
                          {mem.organization?.name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-2">
              {/* Super Admin Panel */}
              {isSuperAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error text-sm font-medium mb-1"
                >
                  <Shield size={14} />
                  Admin Panel
                </Link>
              )}
              {/* Booth Mode - Mobile Only */}
              {onEnterBoothMode && canEnterBoothMode && (
                <button
                  onClick={() => { onEnterBoothMode(); setIsOpen(false); }}
                  className="w-full sm:hidden flex items-center gap-2 px-2 py-2 rounded-lg bg-gradient-to-r from-brand-purple/20 to-brand-pink/20 hover:from-brand-purple/30 hover:to-brand-pink/30 text-brand-purple text-sm font-medium mb-1"
                >
                  <Zap size={14} />
                  Booth Mode
                </button>
              )}
              {onOpenOrgSettings && (
                <button
                  onClick={() => { onOpenOrgSettings(); setIsOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-bg-tertiary text-text-secondary text-sm"
                >
                  <Settings size={14} />
                  Settings
                </button>
              )}
              <button
                onClick={() => { signOut(); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-error/10 text-error text-sm"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

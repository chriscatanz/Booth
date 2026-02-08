'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { user, signOut } = useAuthStore();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedConfirmation = 'DELETE';
  const canDelete = confirmText === expectedConfirmation;

  const handleDelete = async () => {
    if (!canDelete || !user) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Call the delete account RPC function
      const { error: rpcError } = await supabase.rpc('delete_user_account', {
        user_id: user.id
      });

      if (rpcError) throw rpcError;

      // Sign out after successful deletion
      await signOut();
      
      // Redirect to home
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-error/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-error/10">
                <AlertTriangle size={20} className="text-error" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Delete Account</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div className="p-4 rounded-xl bg-error-bg border border-error/20">
              <p className="text-sm text-error font-medium mb-2">
                This action is permanent and cannot be undone.
              </p>
              <p className="text-sm text-text-secondary">
                Deleting your account will:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-text-secondary">
                <li>• Remove all your personal data</li>
                <li>• Delete your organization if you're the only owner</li>
                <li>• Remove you from all organizations you belong to</li>
                <li>• Cancel any active subscriptions</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Type <span className="font-mono text-error font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="w-full px-4 py-2.5 rounded-xl border-2 border-border bg-bg-secondary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-error transition-colors"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-error-bg text-error text-sm"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-border bg-bg-secondary">
            <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              loading={isDeleting}
            >
              <Trash2 size={16} />
              Delete My Account
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

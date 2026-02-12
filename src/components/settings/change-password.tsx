'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { PasswordStrength } from '@/components/ui/password-strength';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, verify the current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('Unable to verify user');
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (updateError) {
        throw updateError;
      }
      
      setStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Reset success status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Lock size={20} />
          Change Password
        </h3>
        <p className="text-sm text-text-secondary mt-1">
          Update your account password. You&apos;ll need to enter your current password to confirm.
        </p>
      </div>

      {status === 'success' && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-center gap-3">
          <CheckCircle className="text-success" size={20} />
          <span className="text-success font-medium">Password updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple"
              placeholder="Enter current password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
              {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            New Password
          </label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple"
            placeholder="Enter new password"
            required
            minLength={8}
          />
          {newPassword && <PasswordStrength password={newPassword} />}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Confirm New Password
          </label>
          <input
            type={showPasswords ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple"
            placeholder="Confirm new password"
            required
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-error mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              Passwords do not match
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
}

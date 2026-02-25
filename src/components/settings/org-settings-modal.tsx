'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as authService from '@/services/auth-service';
import { OrganizationMember, Invitation } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X, Building2, Users, Shield, Save, User,
  Crown, AlertCircle, Check, Trash2, Settings, Clock, Download, List, Palette, Columns, Eye, Bell, Sparkles, Calendar,
  ChevronDown, CreditCard, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';
import { AuditLog } from './audit-log';
import { DataExport } from './data-export';
import { DeleteAccountModal } from './delete-account-modal';
import { CustomListsEditor } from './custom-lists-editor';
import { CustomFieldsEditor } from './custom-fields-editor';
import { BrandingEditor } from './branding-editor';
import { RolePermissionsEditor } from './role-permissions-editor';
import { CalendarIntegration } from './calendar-integration';
import { NotificationPreferences } from '@/components/notifications/notification-preferences';
import { AISettings } from './ai-settings';
import { ChangePassword } from './change-password';
import { Preferences } from './preferences';
import { BillingSettings } from './billing-settings';
import { BadgesView } from '@/components/badges';
import { Sliders, Trophy } from 'lucide-react';

interface OrgSettingsModalProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'account' | 'preferences' | 'badges' | 'billing' | 'branding' | 'members' | 'notifications' | 'calendar' | 'permissions' | 'lists' | 'fields' | 'ai' | 'data' | 'audit' | 'danger';

export function OrgSettingsModal({ onClose }: OrgSettingsModalProps) {
  const { organization, isOwner, isAdmin, refreshOrganizations } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchQuery, setSearchQuery] = useState('');

  // General settings form
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [shippingBufferDays, setShippingBufferDays] = useState<number>(
    (organization?.settings?.shippingBufferDays as number) || 7
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Danger zone
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  // Removed unused isDeleting state
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setShippingBufferDays((organization.settings?.shippingBufferDays as number) || 7);
    }
  }, [organization]);

  const handleSaveGeneral = async () => {
    if (!organization || !orgName.trim()) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await authService.updateOrganization(organization.id, { 
        name: orgName.trim(),
        settings: {
          ...organization.settings,
          shippingBufferDays,
        },
      });
      await refreshOrganizations();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }

    setIsSaving(false);
  };

  const handleDeleteOrg = async () => {
    setError('Organization deletion requires contacting support');
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean; ownerOnly?: boolean; keywords: string[] }[] = [
    { id: 'general', label: 'General', icon: <Building2 size={18} />, keywords: ['organization', 'name', 'shipping', 'buffer', 'company'] },
    { id: 'account', label: 'Account', icon: <User size={18} />, keywords: ['password', 'email', 'profile', 'security', 'login'] },
    { id: 'preferences', label: 'Preferences', icon: <Sliders size={18} />, keywords: ['theme', 'dark', 'light', 'display', 'view'] },
    { id: 'badges', label: 'Badges', icon: <Trophy size={18} />, keywords: ['achievements', 'rewards', 'gamification', 'progress'] },
    { id: 'billing', label: 'Billing', icon: <CreditCard size={18} />, ownerOnly: true, keywords: ['payment', 'subscription', 'plan', 'upgrade', 'invoice', 'pricing'] },
    { id: 'branding', label: 'Branding', icon: <Palette size={18} />, adminOnly: true, keywords: ['logo', 'colors', 'theme', 'customize', 'brand'] },
    { id: 'members', label: 'Members', icon: <Users size={18} />, keywords: ['team', 'users', 'invite', 'roles', 'people'] },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, keywords: ['alerts', 'email', 'reminders', 'updates'] },
    { id: 'calendar', label: 'Calendar Sync', icon: <Calendar size={18} />, keywords: ['google', 'outlook', 'ics', 'subscribe', 'events'] },
    { id: 'permissions', label: 'Permissions', icon: <Eye size={18} />, adminOnly: true, keywords: ['access', 'roles', 'viewer', 'editor', 'admin', 'visibility'] },
    { id: 'lists', label: 'Custom Lists', icon: <List size={18} />, adminOnly: true, keywords: ['dropdown', 'options', 'categories', 'tags'] },
    { id: 'fields', label: 'Custom Fields', icon: <Columns size={18} />, adminOnly: true, keywords: ['data', 'properties', 'attributes', 'custom'] },
    { id: 'ai', label: 'AI Assistant', icon: <Sparkles size={18} />, keywords: ['openai', 'api', 'key', 'generate', 'content'] },
    { id: 'data', label: 'Data Export', icon: <Download size={18} />, keywords: ['csv', 'backup', 'download', 'export'] },
    { id: 'audit', label: 'Audit Log', icon: <Clock size={18} />, adminOnly: true, keywords: ['history', 'changes', 'activity', 'tracking'] },
    { id: 'danger', label: 'Danger Zone', icon: <AlertCircle size={18} />, ownerOnly: true, keywords: ['delete', 'remove', 'destroy', 'cancel'] },
  ];

  const visibleTabs = tabs.filter(t => {
    if (t.ownerOnly && !isOwner) return false;
    if (t.adminOnly && !isAdmin) return false;
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesLabel = t.label.toLowerCase().includes(query);
      const matchesKeywords = t.keywords.some(k => k.includes(query));
      return matchesLabel || matchesKeywords;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-surface rounded-xl sm:rounded-xl border border-border shadow-xl w-full max-w-5xl mx-0 sm:mx-4 h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Settings size={18} className="text-brand-purple sm:w-5 sm:h-5" />
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-text-primary">Settings</h2>
              <p className="text-xs text-text-secondary hidden sm:block">{organization?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Mobile Tab Selector */}
        <div className="sm:hidden px-4 py-3 border-b border-border bg-bg-secondary">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary"
          >
            {visibleTabs.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Body with sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation - hidden on mobile */}
          <nav className="hidden sm:block w-56 shrink-0 border-r border-border bg-bg-secondary overflow-y-auto">
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>
            </div>
            <div className="py-2">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-left',
                    activeTab === tab.id
                      ? 'bg-brand-purple/10 text-brand-purple border-r-2 border-brand-purple'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  )}
                >
                  <span className={cn(
                    activeTab === tab.id ? 'text-brand-purple' : 'text-text-tertiary'
                  )}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {saveSuccess && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-success-bg text-success text-sm">
                <Check size={16} />
                Settings saved successfully
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-base font-medium text-text-primary mb-4">Organization Details</h3>

                    <div className="space-y-4 sm:max-w-lg">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Organization Name
                        </label>
                        <Input
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="Acme Corporation"
                          disabled={!isAdmin}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Organization ID
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-bg-tertiary text-text-tertiary text-sm font-mono">
                          {organization?.id}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Plan
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium capitalize',
                            organization?.plan === 'enterprise' && 'bg-brand-purple/20 text-brand-purple',
                            organization?.plan === 'pro' && 'bg-brand-cyan/20 text-brand-cyan',
                            (!organization?.plan || organization?.plan === 'free') && 'bg-bg-tertiary text-text-secondary'
                          )}>
                            {organization?.plan || 'Free'}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {organization?.planSeats || 3} seats
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Settings */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-base font-medium text-text-primary mb-4">Shipping Settings</h3>
                    <div className="sm:max-w-lg">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                          Shipping Buffer (days)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={shippingBufferDays}
                          onChange={(e) => setShippingBufferDays(parseInt(e.target.value) || 7)}
                          disabled={!isAdmin}
                          className="max-w-32"
                        />
                        <p className="text-xs text-text-tertiary mt-1">
                          Days before warehouse arrival to show &quot;Ship By&quot; date
                        </p>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="primary"
                        onClick={handleSaveGeneral}
                        loading={isSaving}
                        disabled={orgName === organization?.name && shippingBufferDays === ((organization?.settings?.shippingBufferDays as number) || 7)}
                      >
                        <Save size={14} /> Save Changes
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChangePassword />
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <Preferences />
                </motion.div>
              )}

              {activeTab === 'badges' && (
                <motion.div
                  key="badges"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <BadgesView />
                </motion.div>
              )}

              {activeTab === 'billing' && isOwner && (
                <motion.div
                  key="billing"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <BillingSettings />
                </motion.div>
              )}

              {activeTab === 'branding' && isAdmin && (
                <motion.div
                  key="branding"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <BrandingEditor />
                </motion.div>
              )}

              {activeTab === 'members' && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <MembersContent />
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <NotificationPreferences />
                </motion.div>
              )}

              {activeTab === 'calendar' && (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <CalendarIntegration />
                </motion.div>
              )}

              {activeTab === 'permissions' && isAdmin && (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <RolePermissionsEditor />
                </motion.div>
              )}

              {activeTab === 'lists' && isAdmin && (
                <motion.div
                  key="lists"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <CustomListsEditor />
                </motion.div>
              )}

              {activeTab === 'fields' && isAdmin && (
                <motion.div
                  key="fields"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <CustomFieldsEditor />
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <AISettings />
                </motion.div>
              )}

              {activeTab === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <DataExport />
                </motion.div>
              )}

              {activeTab === 'audit' && isAdmin && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <AuditLog />
                </motion.div>
              )}

              {activeTab === 'danger' && isOwner && (
                <motion.div
                  key="danger"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <div className="p-4 rounded-lg border-2 border-error/20 bg-error/5 sm:max-w-xl">
                    <h3 className="text-sm font-medium text-error mb-2 flex items-center gap-2">
                      <AlertCircle size={16} />
                      Delete Organization
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                      Once you delete an organization, there is no going back. All trade shows,
                      attendees, files, and member data will be permanently deleted.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-text-tertiary mb-1">
                          Type <strong>{organization?.name}</strong> to confirm
                        </label>
                        <Input
                          value={deleteConfirmName}
                          onChange={(e) => setDeleteConfirmName(e.target.value)}
                          placeholder={organization?.name}
                        />
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteOrg}
                        disabled={deleteConfirmName !== organization?.name}
                      >
                        <Trash2 size={14} /> Delete Organization
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-border bg-bg-tertiary sm:max-w-xl">
                    <h3 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                      <Trash2 size={16} className="text-text-secondary" />
                      Delete My Account
                    </h3>
                    <p className="text-sm text-text-secondary mb-4">
                      Permanently delete your account and all associated data. If you&apos;re the only
                      owner of this organization, it will be deleted as well.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteAccountModal(true)}
                    >
                      Delete My Account
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
      />
    </div>
  );
}

// Inline members content (reuses logic from MembersModal but embedded)
function MembersContent() {
  const { organization, user, isOwner, isAdmin } = useAuthStore();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!organization?.id) return;
    setIsLoading(true);
    try {
      const [m, i] = await Promise.all([
        authService.fetchOrganizationMembers(organization.id),
        authService.fetchInvitations(organization.id),
      ]);
      setMembers(m);
      setInvitations(i);
    } catch (err) {
      console.error('Load members error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    }
    setIsLoading(false);
  }, [organization]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openMenuId && !(e.target as Element).closest('.member-menu')) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!organization?.id || !user?.id) return;

    setIsInviting(true);
    try {
      const invite = await authService.createInvitation(
        organization.id,
        inviteEmail,
        inviteRole,
        user.id
      );

      // Send email (authenticated)
      try {
        await authenticatedFetch('/api/invite', {
          method: 'POST',
          body: JSON.stringify({
            email: inviteEmail,
            inviterName: user.fullName || user.email,
            organizationName: organization.name,
            role: inviteRole,
            token: invite.token,
            expiresAt: invite.expiresAt,
          }),
        });
      } catch {}

      // Re-fetch through v_invitations decrypt view so email shows decrypted immediately
      const fresh = await authService.fetchInvitations(organization.id);
      setInvitations(fresh);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    }
    setIsInviting(false);
  }

  async function handleChangeRole(memberId: string, newRole: 'admin' | 'editor' | 'viewer') {
    setUpdatingMemberId(memberId);
    setError(null);
    try {
      await authService.updateMemberRole(memberId, newRole);
      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
      setSuccessMessage('Role updated successfully');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
    setUpdatingMemberId(null);
    setOpenMenuId(null);
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the organization? They will lose access immediately.`)) {
      return;
    }
    setUpdatingMemberId(memberId);
    setError(null);
    try {
      await authService.removeMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setSuccessMessage('Member removed');
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    }
    setUpdatingMemberId(null);
    setOpenMenuId(null);
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      await authService.deleteInvitation(invitationId);
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  }

  const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown size={14} className="text-warning" />,
    admin: <Shield size={14} className="text-brand-purple" />,
    editor: <Users size={14} className="text-success" />,
    viewer: <Eye size={14} className="text-text-tertiary" />,
  };

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  };

  if (isLoading) {
    return <div className="text-center py-8 text-text-tertiary">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success-bg text-success text-sm">
          <Check size={16} />
          {successMessage}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-text-primary">Team Members</h3>
          <p className="text-sm text-text-secondary">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {(isOwner || isAdmin) && !showInviteForm && (
          <Button variant="outline" size="sm" onClick={() => setShowInviteForm(true)}>
            Invite Member
          </Button>
        )}
      </div>

      {showInviteForm && (
        <form onSubmit={handleInvite} className="p-4 rounded-lg bg-bg-tertiary space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowInviteForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isInviting}>
              Send Invite
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {members.map((member) => {
          const isCurrentUser = member.userId === user?.id;
          const isOwnerMember = member.role === 'owner';
          // Owners and admins can manage members (but not themselves or other owners)
          const canManage = (isOwner || isAdmin) && !isCurrentUser && !isOwnerMember;
          
          return (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary">
              <div className="w-9 h-9 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple text-sm font-medium">
                {member.user?.fullName?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {member.user?.fullName || member.user?.email}
                  {isCurrentUser && <span className="ml-1 text-text-tertiary">(you)</span>}
                </p>
                <p className="text-xs text-text-secondary truncate">{member.user?.email}</p>
              </div>
              
              {/* Role display / selector */}
              <div className="flex items-center gap-2 relative member-menu">
                {canManage ? (
                  <>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                      disabled={updatingMemberId === member.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-bg-secondary transition-colors text-sm"
                    >
                      {roleIcons[member.role]}
                      <span className="text-text-secondary">{roleLabels[member.role]}</span>
                      <ChevronDown size={14} className="text-text-tertiary" />
                    </button>
                    
                    {/* Dropdown menu */}
                    {openMenuId === member.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-lg py-1 z-10">
                        <div className="px-2 py-1 text-xs text-text-tertiary font-medium">Change role</div>
                        {(['admin', 'editor', 'viewer'] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => handleChangeRole(member.id, role)}
                            disabled={member.role === role}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-bg-tertiary transition-colors',
                              member.role === role && 'bg-bg-tertiary text-brand-purple'
                            )}
                          >
                            {roleIcons[role]}
                            <span>{roleLabels[role]}</span>
                            {member.role === role && <Check size={14} className="ml-auto text-brand-purple" />}
                          </button>
                        ))}
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user?.fullName || member.user?.email || 'member')}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left text-error hover:bg-error-bg transition-colors"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    {roleIcons[member.role]}
                    <span className="text-xs text-text-secondary">{roleLabels[member.role]}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {invitations.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-text-secondary mb-2">
            Pending Invitations ({invitations.length})
          </h4>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary/50 border border-dashed border-border">
                <span className="text-sm text-text-secondary flex-1">{inv.email}</span>
                <span className="text-xs text-text-tertiary capitalize">({inv.role})</span>
                {(isOwner || isAdmin) && (
                  <button
                    onClick={() => handleCancelInvitation(inv.id)}
                    className="p-1 text-text-tertiary hover:text-error transition-colors"
                    title="Cancel invitation"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

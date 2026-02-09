'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import * as authService from '@/services/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X, Building2, Users, Shield, Save, Upload,
  Crown, AlertCircle, Check, Trash2, Settings, Clock, Download, List, Palette, Columns, Eye, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/api';
import { MembersModal } from '@/components/auth/members-modal';
import { AuditLog } from './audit-log';
import { DataExport } from './data-export';
import { DeleteAccountModal } from './delete-account-modal';
import { CustomListsEditor } from './custom-lists-editor';
import { CustomFieldsEditor } from './custom-fields-editor';
import { BrandingEditor } from './branding-editor';
import { RolePermissionsEditor } from './role-permissions-editor';
import { NotificationPreferences } from '@/components/notifications/notification-preferences';

interface OrgSettingsModalProps {
  onClose: () => void;
}

type SettingsTab = 'general' | 'branding' | 'members' | 'notifications' | 'permissions' | 'lists' | 'fields' | 'data' | 'audit' | 'danger';

export function OrgSettingsModal({ onClose }: OrgSettingsModalProps) {
  const { organization, user, isOwner, isAdmin, refreshOrganizations } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

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
  const [isDeleting, setIsDeleting] = useState(false);
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
    // This would need a backend function - for now just show the UI
    setError('Organization deletion requires contacting support');
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'general', label: 'General', icon: <Building2 size={16} /> },
    { id: 'branding', label: 'Branding', icon: <Palette size={16} />, adminOnly: true },
    { id: 'members', label: 'Members', icon: <Users size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'permissions', label: 'Permissions', icon: <Eye size={16} />, adminOnly: true },
    { id: 'lists', label: 'Custom Lists', icon: <List size={16} />, adminOnly: true },
    { id: 'fields', label: 'Custom Fields', icon: <Columns size={16} />, adminOnly: true },
    { id: 'data', label: 'Data Export', icon: <Download size={16} /> },
    { id: 'audit', label: 'Audit Log', icon: <Clock size={16} />, adminOnly: true },
    { id: 'danger', label: 'Danger Zone', icon: <AlertCircle size={16} />, adminOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly || isOwner);

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
        className="relative bg-surface rounded-xl border border-border shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Settings size={20} className="text-brand-purple" />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Organization Settings</h2>
              <p className="text-xs text-text-secondary">{organization?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 overflow-x-auto scrollbar-hide">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-brand-purple text-brand-purple'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-medium text-text-primary mb-4">Organization Details</h3>

                  <div className="space-y-4">
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
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-medium text-text-primary mb-3">Shipping Settings</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                      />
                      <p className="text-xs text-text-tertiary mt-1">
                        Days before warehouse arrival to show "Ship By" date
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

            {activeTab === 'branding' && isAdmin && (
              <motion.div
                key="branding"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BrandingEditor />
              </motion.div>
            )}

            {activeTab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <MembersContent />
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <NotificationPreferences />
              </motion.div>
            )}

            {activeTab === 'permissions' && isAdmin && (
              <motion.div
                key="permissions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RolePermissionsEditor />
              </motion.div>
            )}

            {activeTab === 'lists' && isAdmin && (
              <motion.div
                key="lists"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CustomListsEditor />
              </motion.div>
            )}

            {activeTab === 'fields' && isAdmin && (
              <motion.div
                key="fields"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CustomFieldsEditor />
              </motion.div>
            )}

            {activeTab === 'data' && (
              <motion.div
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DataExport />
              </motion.div>
            )}

            {activeTab === 'audit' && isAdmin && (
              <motion.div
                key="audit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AuditLog />
              </motion.div>
            )}

            {activeTab === 'danger' && isOwner && (
              <motion.div
                key="danger"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="p-4 rounded-lg border-2 border-error/20 bg-error/5">
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
                      loading={isDeleting}
                    >
                      <Trash2 size={14} /> Delete Organization
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg border-2 border-border bg-bg-tertiary">
                  <h3 className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                    <Trash2 size={16} className="text-text-secondary" />
                    Delete My Account
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Permanently delete your account and all associated data. If you're the only
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
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [organization?.id]);

  async function loadData() {
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
  }

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

      setInvitations([invite, ...invitations]);
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    }
    setIsInviting(false);
  }

  const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown size={14} className="text-warning" />,
    admin: <Shield size={14} className="text-brand-purple" />,
    editor: <Users size={14} className="text-success" />,
    viewer: <Users size={14} className="text-text-tertiary" />,
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

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">
          Team Members ({members.length})
        </h3>
        {isAdmin && !showInviteForm && (
          <Button variant="outline" size="sm" onClick={() => setShowInviteForm(true)}>
            Invite Member
          </Button>
        )}
      </div>

      {showInviteForm && (
        <form onSubmit={handleInvite} className="p-4 rounded-lg bg-bg-tertiary space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@example.com"
              required
              className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-surface border border-border text-sm"
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
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary">
            <div className="w-9 h-9 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple text-sm font-medium">
              {member.user?.fullName?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {member.user?.fullName || member.user?.email}
                {member.userId === user?.id && <span className="ml-1 text-text-tertiary">(you)</span>}
              </p>
              <p className="text-xs text-text-secondary truncate">{member.user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {roleIcons[member.role]}
              <span className="text-xs text-text-secondary capitalize">{member.role}</span>
            </div>
          </div>
        ))}
      </div>

      {invitations.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-xs font-medium text-text-tertiary mb-2">
            Pending Invitations ({invitations.length})
          </h4>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-2 rounded-lg bg-bg-tertiary/50 border border-dashed border-border">
                <span className="text-sm text-text-secondary">{inv.email}</span>
                <span className="text-xs text-text-tertiary capitalize">({inv.role})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

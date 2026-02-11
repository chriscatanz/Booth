'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { OrganizationMember, Invitation, UserRole } from '@/types/auth';
import * as authService from '@/services/auth-service';
import { authenticatedFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { 
  X, Users, UserPlus, Mail, Loader2, Trash2, 
  Crown, Shield, Edit3, Eye, AlertCircle, Check, Copy
} from 'lucide-react';

interface MembersModalProps {
  onClose: () => void;
}

export function MembersModal({ onClose }: MembersModalProps) {
  const { organization, user, isOwner } = useAuthStore();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Invitation['role']>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [organization?.id]);

  async function loadData() {
    if (!organization?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [membersData, invitesData] = await Promise.all([
        authService.fetchOrganizationMembers(organization.id),
        authService.fetchInvitations(organization.id),
      ]);
      setMembers(membersData);
      setInvitations(invitesData);
    } catch (err) {
      console.error('Load members error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load members');
    }
    
    setIsLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!organization?.id || !user?.id || !inviteEmail.trim()) return;

    setIsInviting(true);
    setError(null);
    
    try {
      // Create invitation record
      const invite = await authService.createInvitation(
        organization.id,
        inviteEmail.trim(),
        inviteRole,
        user.id
      );
      
      // Send email notification via API (authenticated)
      try {
        await authenticatedFetch('/api/invite', {
          method: 'POST',
          body: JSON.stringify({
            email: inviteEmail.trim(),
            inviterName: user.fullName || user.email,
            organizationName: organization.name,
            role: inviteRole,
            token: invite.token,
            expiresAt: invite.expiresAt,
          }),
        });
      } catch (emailErr) {
        // Email is best-effort, don't fail the whole invite
        console.warn('Failed to send invitation email:', emailErr);
      }
      
      setInvitations([invite, ...invitations]);
      setInviteEmail('');
      setShowInviteForm(false);
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setTimeout(() => setInviteSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
    
    setIsInviting(false);
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Remove this member from the organization?')) return;
    
    try {
      await authService.removeMember(memberId);
      setMembers(members.filter(m => m.id !== memberId));
    } catch (_err) {
      setError('Failed to remove member');
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      await authService.deleteInvitation(inviteId);
      setInvitations(invitations.filter(i => i.id !== inviteId));
    } catch (_err) {
      setError('Failed to revoke invitation');
    }
  }

  async function handleUpdateRole(memberId: string, newRole: UserRole) {
    try {
      await authService.updateMemberRole(memberId, newRole);
      setMembers(members.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));
    } catch (_err) {
      setError('Failed to update role');
    }
  }

  const roleIcons: Record<UserRole, React.ReactNode> = {
    owner: <Crown size={14} className="text-warning" />,
    admin: <Shield size={14} className="text-brand-purple" />,
    editor: <Edit3 size={14} className="text-success" />,
    viewer: <Eye size={14} className="text-text-tertiary" />,
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}?invite=${token}`;
    navigator.clipboard.writeText(url);
  };

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
        className="relative bg-surface rounded-xl border border-border shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Users size={20} className="text-brand-purple" />
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Team Members</h2>
              <p className="text-xs text-text-secondary">{organization?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-tertiary text-text-secondary">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-error-bg text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {inviteSuccess && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-success-bg text-success text-sm">
              <Check size={16} />
              {inviteSuccess}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-text-tertiary" />
            </div>
          ) : (
            <>
              {/* Invite form */}
              <AnimatePresence>
                {showInviteForm && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleInvite}
                    className="mb-6 p-4 rounded-lg bg-bg-tertiary space-y-3 overflow-hidden"
                  >
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        required
                        className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as Invitation['role'])}
                        className="px-3 py-2 rounded-lg bg-surface border border-border text-sm text-text-primary focus:outline-none"
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
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Members list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-text-secondary">
                    Members ({members.length})
                  </h3>
                  {!showInviteForm && (
                    <Button variant="outline" size="sm" onClick={() => setShowInviteForm(true)}>
                      <UserPlus size={14} /> Invite
                    </Button>
                  )}
                </div>

                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-purple/20 flex items-center justify-center text-brand-purple text-sm font-medium">
                      {member.user?.fullName?.[0]?.toUpperCase() || member.user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {member.user?.fullName || member.user?.email}
                        {member.userId === user?.id && (
                          <span className="ml-2 text-xs text-text-tertiary">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-text-secondary truncate">{member.user?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {roleIcons[member.role]}
                      {isOwner && member.userId !== user?.id && member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value as UserRole)}
                          className="text-xs px-2 py-1 rounded bg-surface border border-border text-text-primary"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className="text-xs text-text-secondary capitalize">{member.role}</span>
                      )}
                      {isOwner && member.userId !== user?.id && member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 rounded hover:bg-error/10 text-text-tertiary hover:text-error"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending invitations */}
              {invitations.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-medium text-text-secondary mb-3">
                    Pending Invitations ({invitations.length})
                  </h3>
                  {invitations.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary/50 border border-dashed border-border"
                    >
                      <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center">
                        <Mail size={16} className="text-warning" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{invite.email}</p>
                        <p className="text-xs text-text-tertiary">
                          Invited as {invite.role} • Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyInviteLink(invite.token)}
                          className="p-1.5 rounded hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary"
                          title="Copy invite link"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="p-1.5 rounded hover:bg-error/10 text-text-tertiary hover:text-error"
                          title="Revoke invitation"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

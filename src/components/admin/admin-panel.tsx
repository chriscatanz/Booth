'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Users, 
  Building2, 
  CreditCard, 
  Calendar,
  Search,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface OrgStats {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  showCount: number;
  tier: string;
  status: string;
  createdAt: string;
}

interface UserStats {
  id: string;
  email: string;
  fullName: string | null;
  isSuperAdmin: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  orgCount: number;
}

interface PlatformStats {
  totalOrgs: number;
  totalUsers: number;
  totalShows: number;
  activeTrials: number;
  paidSubscriptions: number;
  mrr: number;
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orgs' | 'users' | 'subscriptions'>('overview');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [orgs, setOrgs] = useState<OrgStats[]>([]);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load platform stats
      const [orgsRes, usersRes, showsRes, subsRes] = await Promise.all([
        supabase.from('organizations').select('id', { count: 'exact' }),
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('tradeshows').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('tier, status'),
      ]);

      const subscriptions = subsRes.data || [];
      const activeTrials = subscriptions.filter(s => s.tier === 'trial' && s.status === 'active').length;
      const paidSubs = subscriptions.filter(s => ['starter', 'pro'].includes(s.tier) && s.status === 'active');
      const mrr = paidSubs.reduce((acc, s) => {
        if (s.tier === 'starter') return acc + 74;
        if (s.tier === 'pro') return acc + 124;
        return acc;
      }, 0);

      setStats({
        totalOrgs: orgsRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalShows: showsRes.count || 0,
        activeTrials,
        paidSubscriptions: paidSubs.length,
        mrr,
      });

      // Load orgs with details
      const { data: orgData } = await supabase
        .from('organizations')
        .select(`
          id, name, slug, created_at,
          organization_members(count),
          tradeshows(count),
          subscriptions(tier, status)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (orgData) {
        setOrgs(orgData.map((org: any) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          memberCount: org.organization_members?.[0]?.count || 0,
          showCount: org.tradeshows?.[0]?.count || 0,
          tier: org.subscriptions?.[0]?.tier || 'none',
          status: org.subscriptions?.[0]?.status || 'none',
          createdAt: org.created_at,
        })));
      }

      // Load users
      const { data: userData } = await supabase
        .from('user_profiles')
        .select(`
          id, email, full_name, is_super_admin, last_active_at, created_at,
          organization_members(count)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (userData) {
        setUsers(userData.map((user: any) => ({
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          isSuperAdmin: user.is_super_admin,
          lastActiveAt: user.last_active_at,
          createdAt: user.created_at,
          orgCount: user.organization_members?.[0]?.count || 0,
        })));
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
    setLoading(false);
  };

  const filteredOrgs = orgs.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orgs', label: 'Organizations', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  ] as const;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-error-bg">
              <Shield size={24} className="text-error" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Super Admin Panel</h1>
              <p className="text-sm text-text-secondary">Platform-wide management</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-purple text-white'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {(activeTab === 'orgs' || activeTab === 'users') && (
          <div className="relative mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-purple/50"
            />
          </div>
        )}

        {/* Content */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard label="Organizations" value={stats.totalOrgs} icon={Building2} />
            <StatCard label="Users" value={stats.totalUsers} icon={Users} />
            <StatCard label="Trade Shows" value={stats.totalShows} icon={Calendar} />
            <StatCard label="Active Trials" value={stats.activeTrials} icon={AlertTriangle} color="warning" />
            <StatCard label="Paid Subs" value={stats.paidSubscriptions} icon={CreditCard} color="success" />
            <StatCard label="MRR" value={`$${stats.mrr}`} icon={TrendingUp} color="brand" />
          </div>
        )}

        {activeTab === 'orgs' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Organization</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Members</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Shows</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Tier</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map(org => (
                  <tr key={org.id} className="border-t border-border hover:bg-bg-tertiary/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{org.name}</p>
                        <p className="text-xs text-text-tertiary">{org.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{org.memberCount}</td>
                    <td className="px-4 py-3 text-text-secondary">{org.showCount}</td>
                    <td className="px-4 py-3">
                      <TierBadge tier={org.tier} status={org.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">
                      {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Orgs</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Last Active</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-t border-border hover:bg-bg-tertiary/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{user.fullName || 'No name'}</p>
                        <p className="text-xs text-text-tertiary">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{user.orgCount}</td>
                    <td className="px-4 py-3">
                      {user.isSuperAdmin ? (
                        <span className="px-2 py-1 rounded-full bg-error-bg text-error text-xs font-medium">
                          Super Admin
                        </span>
                      ) : (
                        <span className="text-text-tertiary text-sm">User</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">
                      {user.lastActiveAt 
                        ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-tertiary">
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-tertiary">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Organization</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Tier</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Members</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-text-secondary">Shows</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map(org => (
                  <tr key={org.id} className="border-t border-border hover:bg-bg-tertiary/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{org.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={org.tier} status={org.status} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        org.status === 'active' ? 'bg-success-bg text-success' :
                        org.status === 'past_due' ? 'bg-warning-bg text-warning' :
                        'bg-bg-tertiary text-text-tertiary'
                      }`}>
                        {org.status || 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{org.memberCount}</td>
                    <td className="px-4 py-3 text-text-secondary">{org.showCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color = 'default' 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color?: 'default' | 'success' | 'warning' | 'brand';
}) {
  const colors = {
    default: 'bg-bg-tertiary text-text-secondary',
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    brand: 'bg-brand-purple/10 text-brand-purple',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border rounded-xl p-4"
    >
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-tertiary">{label}</p>
    </motion.div>
  );
}

function TierBadge({ tier, status }: { tier: string; status: string }) {
  const tierColors: Record<string, string> = {
    trial: 'bg-blue-500/10 text-blue-500',
    starter: 'bg-brand-purple/10 text-brand-purple',
    pro: 'bg-success-bg text-success',
    none: 'bg-bg-tertiary text-text-tertiary',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[tier] || tierColors.none}`}>
      {tier === 'starter' ? 'Team' : tier === 'pro' ? 'Business' : tier || 'None'}
    </span>
  );
}

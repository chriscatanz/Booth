'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AuditEntry, 
  fetchAuditLog, 
  formatAuditAction, 
  getAuditActionColor,
  AuditAction,
  ResourceType,
} from '@/services/audit-service';
import { 
  Clock, User, FileText, Users, Settings, 
  LogIn, LogOut, Mail, Shield, Trash2, 
  PlusCircle, Edit, Eye, Download, ChevronLeft, 
  ChevronRight, Filter, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface AuditLogProps {
  className?: string;
}

export function AuditLog({ className }: AuditLogProps) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState<AuditAction | ''>('');
  const [filterResource, setFilterResource] = useState<ResourceType | ''>('');
  const pageSize = 20;

  const loadData = async () => {
    setIsLoading(true);
    const result = await fetchAuditLog({
      limit: pageSize,
      offset: page * pageSize,
      action: filterAction || undefined,
      resourceType: filterResource || undefined,
    });
    setEntries(result.entries);
    setTotal(result.total);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [page, filterAction, filterResource]);

  const totalPages = Math.ceil(total / pageSize);

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'create': return <PlusCircle size={14} />;
      case 'update': return <Edit size={14} />;
      case 'delete': return <Trash2 size={14} />;
      case 'view': return <Eye size={14} />;
      case 'export': return <Download size={14} />;
      case 'login': return <LogIn size={14} />;
      case 'logout': return <LogOut size={14} />;
      case 'invite_sent':
      case 'invite_accepted': return <Mail size={14} />;
      case 'member_added':
      case 'member_removed': return <Users size={14} />;
      case 'role_changed': return <Shield size={14} />;
      case 'settings_changed': return <Settings size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'tradeshow': return '📊';
      case 'attendee': return '👤';
      case 'file': return '📄';
      case 'template': return '📋';
      case 'organization': return '🏢';
      case 'member': return '👥';
      case 'invitation': return '✉️';
      default: return '📁';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Filter size={14} />
          Filters:
        </div>
        
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value as AuditAction | ''); setPage(0); }}
          className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary"
        >
          <option value="">All Actions</option>
          <option value="create">Created</option>
          <option value="update">Updated</option>
          <option value="delete">Deleted</option>
          <option value="login">Login</option>
          <option value="invite_sent">Invites</option>
          <option value="member_added">Members</option>
        </select>

        <select
          value={filterResource}
          onChange={(e) => { setFilterResource(e.target.value as ResourceType | ''); setPage(0); }}
          className="px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border text-sm text-text-primary"
        >
          <option value="">All Resources</option>
          <option value="tradeshow">Trade Shows</option>
          <option value="attendee">Attendees</option>
          <option value="file">Files</option>
          <option value="member">Members</option>
          <option value="invitation">Invitations</option>
        </select>

        <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </Button>

        <div className="ml-auto text-xs text-text-tertiary">
          {total} total events
        </div>
      </div>

      {/* Log entries */}
      <div className="border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-text-tertiary">Loading audit log...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-text-tertiary">No audit events found</div>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="flex items-start gap-3 p-3 hover:bg-bg-tertiary/50"
              >
                {/* Action icon */}
                <div className={cn(
                  'mt-0.5 p-1.5 rounded-lg bg-bg-tertiary',
                  getAuditActionColor(entry.action)
                )}>
                  {getActionIcon(entry.action)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-text-primary">
                      {entry.user?.fullName || entry.user?.email || 'System'}
                    </span>
                    <span className="text-sm text-text-secondary">
                      {formatAuditAction(entry.action).toLowerCase()}
                    </span>
                    {entry.resourceType && (
                      <>
                        <span className="text-sm text-text-tertiary">
                          {getResourceIcon(entry.resourceType)}
                        </span>
                        <span className="text-sm text-text-primary">
                          {entry.resourceName || entry.resourceType}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <div className="mt-1 text-xs text-text-tertiary">
                      {Object.entries(entry.metadata).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {String(value).slice(0, 30)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-right shrink-0">
                  <div className="text-xs text-text-tertiary" title={format(new Date(entry.createdAt), 'PPpp')}>
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || isLoading}
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          
          <span className="text-sm text-text-secondary">
            Page {page + 1} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || isLoading}
          >
            Next <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

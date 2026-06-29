import * as React from 'react';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input, Label } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import type { OrgRole } from './OrgSwitcher';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrgMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: OrgRole;
  joinedAt: string;
  lastActiveAt: string | null;
  status: 'active' | 'pending' | 'suspended';
}

export interface MemberManagerProps {
  members: OrgMember[];
  currentUserRole: OrgRole;
  onInvite: (data: { email: string; role: OrgRole }) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
  onChangeRole: (memberId: string, role: OrgRole) => Promise<void>;
  onResendInvite?: (memberId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const roleBadgeVariant: Record<OrgRole, 'info' | 'success' | 'default'> = {
  ADMIN: 'info',
  MEMBER: 'success',
  VIEWER: 'default',
};

const roleLabels: Record<OrgRole, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const roleDescriptions: Record<OrgRole, string> = {
  ADMIN: 'Full access. Can manage members, settings, and billing.',
  MEMBER: 'Can create repos, trigger runs, and manage findings.',
  VIEWER: 'Read-only access to repositories and findings.',
};

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  pending: 'warning',
  suspended: 'error',
};

const ALL_ROLES: OrgRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

const canManage = (currentRole: OrgRole, targetRole: OrgRole): boolean => {
  if (currentRole !== 'ADMIN') return false;
  // Admin cannot modify other admins (safety)
  return targetRole !== 'ADMIN';
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberManager({
  members,
  currentUserRole,
  onInvite,
  onRemove,
  onChangeRole,
  onResendInvite,
  loading = false,
  className,
}: MemberManagerProps) {
  const isAdmin = currentUserRole === 'ADMIN';
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<OrgRole>('MEMBER');
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, search]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }
    setInviteError(null);
    setInviteLoading(true);
    try {
      await onInvite({ email: inviteEmail.trim(), role: inviteRole });
      setInviteEmail('');
      setInviteRole('MEMBER');
      setInviteOpen(false);
    } catch {
      setInviteError('Failed to send invitation. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-fg">Team Members</h2>
          <p className="text-sm text-fg-muted mt-0.5">
            {members.length} member{members.length !== 1 ? 's' : ''} in your organization
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setInviteOpen(true)}
            leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            }
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Search */}
      <Input
        placeholder="Search members by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        }
      />

      {/* Member List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-fg-muted text-sm">No members found</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                canManage={isAdmin}
                onChangeRole={onChangeRole}
                onRemove={onRemove}
                onResendInvite={onResendInvite}
              />
            ))
          )}
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Team Member"
        description="Send an invitation to join your organization."
        size="md"
      >
        <form onSubmit={handleInvite} className="space-y-5">
          <div>
            <Label htmlFor="invite-email" required>
              Email Address
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              error={inviteError ?? undefined}
              required
            />
          </div>

          <div>
            <Label htmlFor="invite-role" required>
              Role
            </Label>
            <Select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              options={ALL_ROLES.map((r) => ({
                value: r,
                label: roleLabels[r],
                description: roleDescriptions[r],
              }))}
            />
            <p className="text-xs text-fg-subtle mt-1.5">
              {roleDescriptions[inviteRole]}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setInviteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={inviteLoading}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Member Row Sub-component ─────────────────────────────────────────────────

interface MemberRowProps {
  member: OrgMember;
  canManage: boolean;
  onChangeRole: (memberId: string, role: OrgRole) => Promise<void>;
  onRemove: (memberId: string) => Promise<void>;
  onResendInvite?: (memberId: string) => Promise<void>;
}

function MemberRow({
  member,
  canManage,
  onChangeRole,
  onRemove,
  onResendInvite,
}: MemberRowProps) {
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);

  const handleRoleChange = async (role: OrgRole) => {
    setActionLoading(true);
    try {
      await onChangeRole(member.id, role);
      setRoleOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemove = async () => {
    setActionLoading(true);
    try {
      await onRemove(member.id);
    } finally {
      setActionLoading(false);
      setConfirmRemove(false);
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-bg-secondary hover:bg-bg-hover transition-colors">
      <Avatar
        size="md"
        src={member.avatarUrl}
        fallback={member.name.slice(0, 2).toUpperCase()}
        status={member.status === 'active' ? 'online' : member.status === 'pending' ? 'away' : 'offline'}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg truncate">
            {member.name}
          </span>
          <Badge variant={roleBadgeVariant[member.role]} size="sm">
            {roleLabels[member.role]}
          </Badge>
          {member.status !== 'active' && (
            <Badge variant={statusBadgeVariant[member.status]} size="sm" dot>
              {member.status}
            </Badge>
          )}
        </div>
        <span className="text-xs text-fg-muted block truncate">
          {member.email}
        </span>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Role Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleOpen((v) => !v)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg',
                'bg-bg-tertiary border border-border text-fg',
                'hover:border-border-hover transition-colors'
              )}
            >
              Change Role
            </button>
            {roleOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-card-bg border border-card-border rounded-lg shadow-xl py-1 min-w-[160px]">
                {ALL_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={actionLoading || member.role === role}
                    onClick={() => handleRoleChange(role)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm',
                      member.role === role
                        ? 'text-accent bg-accent/10'
                        : 'text-fg hover:bg-bg-hover',
                      actionLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {roleLabels[role]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resend Invite */}
          {member.status === 'pending' && onResendInvite && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onResendInvite(member.id)}
            >
              Resend
            </Button>
          )}

          {/* Remove */}
          {confirmRemove ? (
            <div className="flex items-center gap-1">
              <Button
                variant="danger"
                size="xs"
                loading={actionLoading}
                onClick={handleRemove}
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setConfirmRemove(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setConfirmRemove(true)}
              leftIcon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default MemberManager;

import * as React from 'react';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  role: OrgRole;
  memberCount: number;
  repoCount: number;
  plan: 'free' | 'team' | 'enterprise';
}

export interface OrgSwitcherProps {
  organizations: Organization[];
  currentOrg: Organization | null;
  onSelect: (org: Organization) => void;
  onCreateOrg?: () => void;
  loading?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const roleBadgeVariant: Record<OrgRole, 'info' | 'default' | 'success'> = {
  ADMIN: 'info',
  MEMBER: 'success',
  VIEWER: 'default',
};

const roleLabels: Record<OrgRole, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const planBadgeVariant: Record<string, 'default' | 'info' | 'warning'> = {
  free: 'default',
  team: 'info',
  enterprise: 'warning',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OrgSwitcher({
  organizations,
  currentOrg,
  onSelect,
  onCreateOrg,
  loading = false,
  className,
}: OrgSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return organizations;
    const q = search.toLowerCase();
    return organizations.filter(
      (o) => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    );
  }, [organizations, search]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-3 w-full px-3 py-2 rounded-lg',
          'bg-bg-secondary border border-border',
          'hover:border-border-hover transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          open && 'border-accent'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentOrg ? (
          <>
            <Avatar
              size="sm"
              fallback={currentOrg.name.slice(0, 2).toUpperCase()}
              src={currentOrg.logoUrl}
            />
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-fg truncate">
                  {currentOrg.name}
                </span>
                <Badge variant={roleBadgeVariant[currentOrg.role]} size="sm">
                  {roleLabels[currentOrg.role]}
                </Badge>
              </div>
              <span className="text-xs text-fg-muted">
                {currentOrg.repoCount} repos · {currentOrg.memberCount} members
              </span>
            </div>
          </>
        ) : (
          <span className="text-sm text-fg-muted flex-1 text-left">
            Select organization
          </span>
        )}
        <svg
          className={cn(
            'w-4 h-4 text-fg-muted transition-transform',
            open && 'rotate-180'
          )}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={cn(
            'absolute z-[1200] top-full left-0 right-0 mt-2',
            'bg-card-bg border border-card-border rounded-xl shadow-xl',
            'overflow-hidden animate-slide-down'
          )}
          role="listbox"
        >
          {/* Search */}
          <div className="p-3 border-b border-border">
            <input
              type="text"
              placeholder="Search organizations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                'bg-bg-tertiary border border-border text-fg',
                'placeholder-fg-subtle',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent'
              )}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center text-sm text-fg-muted">
              Loading organizations…
            </div>
          )}

          {/* Organization List */}
          {!loading && (
            <div className="max-h-[280px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-fg-muted">
                  No organizations found
                </div>
              ) : (
                filtered.map((org) => {
                  const isActive = currentOrg?.id === org.id;
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => {
                        onSelect(org);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left',
                        'transition-colors',
                        isActive
                          ? 'bg-accent/10 border-l-2 border-l-accent'
                          : 'hover:bg-bg-hover border-l-2 border-l-transparent'
                      )}
                      role="option"
                      aria-selected={isActive}
                    >
                      <Avatar
                        size="sm"
                        fallback={org.name.slice(0, 2).toUpperCase()}
                        src={org.logoUrl}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-fg truncate">
                            {org.name}
                          </span>
                          <Badge variant={roleBadgeVariant[org.role]} size="sm">
                            {roleLabels[org.role]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-fg-subtle">
                            {org.repoCount} repos · {org.memberCount} members
                          </span>
                          <Badge
                            variant={planBadgeVariant[org.plan] ?? 'default'}
                            size="sm"
                          >
                            {org.plan}
                          </Badge>
                        </div>
                      </div>
                      {isActive && (
                        <svg
                          className="w-4 h-4 text-accent flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Footer */}
          {onCreateOrg && (
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                leftIcon={
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                  </svg>
                }
                onClick={() => {
                  setOpen(false);
                  onCreateOrg();
                }}
              >
                Create Organization
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrgSwitcher;

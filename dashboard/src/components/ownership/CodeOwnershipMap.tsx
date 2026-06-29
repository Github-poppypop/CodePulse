import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Modal } from '../ui/Modal';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  team: string;
}

export interface OwnershipEntry {
  id: string;
  filePath: string;
  directory: string;
  primaryOwner: TeamMember;
  secondaryOwners: TeamMember[];
  lastCommit: string;
  lastCommitDate: string;
  commitCount: number;
  linesChanged: number;
  autoAssignedFindings: number;
}

export interface OwnershipRule {
  id: string;
  pattern: string;
  owner: TeamMember;
  team: string;
  priority: number;
}

interface CodeOwnershipMapProps {
  ownership?: OwnershipEntry[];
  rules?: OwnershipRule[];
  teams?: TeamMember[];
  loading?: boolean;
  onAssignFinding?: (findingId: string, ownerId: string) => void;
  onAddRule?: (pattern: string, ownerId: string, team: string) => void;
  onRemoveRule?: (ruleId: string) => void;
  onRefreshBlame?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getCommitColor(commits: number): string {
  if (commits > 50) return 'bg-accent';
  if (commits > 20) return 'bg-accent/70';
  if (commits > 5) return 'bg-accent/40';
  return 'bg-bg-tertiary';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString();
}

// ─── Components ──────────────────────────────────────────────────────────────

function OwnerAvatar({ member, size = 'sm' }: { member: TeamMember; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium',
        'bg-accent/20 text-accent border border-accent/30',
        sizes[size]
      )}
      title={`${member.name} (${member.team})`}
    >
      {getInitials(member.name)}
    </div>
  );
}

function CommitHeatBar({ count, max }: { count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-fg-muted font-mono w-8 text-right">{count}</span>
    </div>
  );
}

function DirectoryTree({ entries }: { entries: OwnershipEntry[] }) {
  const tree = useMemo(() => {
    const root: Record<string, { entry?: OwnershipEntry; children: Record<string, any> }> = {};
    entries.forEach(entry => {
      const parts = entry.directory.split('/').filter(Boolean);
      let current = root;
      parts.forEach((part, i) => {
        if (!current[part]) current[part] = { children: {} };
        if (i === parts.length - 1) current[part].entry = entry;
        current = current[part].children;
      });
    });
    return root;
  }, [entries]);

  function renderNode(node: Record<string, any>, depth = 0): React.ReactNode {
    return Object.entries(node).map(([name, data]: [string, any]) => (
      <div key={name} style={{ marginLeft: depth * 16 }}>
        <div className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-lg',
          data.entry ? 'hover:bg-bg-hover cursor-pointer' : ''
        )}>
          <svg className="w-4 h-4 text-fg-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span className="text-sm text-fg">{name}</span>
          {data.entry && (
            <>
              <OwnerAvatar member={data.entry.primaryOwner} />
              <span className="text-xs text-fg-muted ml-auto">{data.entry.commitCount} commits</span>
            </>
          )}
        </div>
        {data.children && renderNode(data.children, depth + 1)}
      </div>
    ));
  }

  return <div className="space-y-px">{renderNode(tree)}</div>;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CodeOwnershipMap({
  ownership = [],
  rules = [],
  teams = [],
  loading = false,
  onAssignFinding,
  onAddRule,
  onRemoveRule,
  onRefreshBlame,
}: CodeOwnershipMapProps) {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'rules'>('list');
  const [selectedEntry, setSelectedEntry] = useState<OwnershipEntry | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newPattern, setNewPattern] = useState('');
  const [newRuleOwner, setNewRuleOwner] = useState('');
  const [newRuleTeam, setNewRuleTeam] = useState('');
  const [autoAssign, setAutoAssign] = useState(true);

  const filteredOwnership = useMemo(() => {
    return ownership.filter(o => {
      if (search && !o.filePath.toLowerCase().includes(search.toLowerCase()) && !o.primaryOwner.name.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (teamFilter !== 'all' && o.primaryOwner.team !== teamFilter) return false;
      return true;
    });
  }, [ownership, search, teamFilter]);

  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    ownership.forEach(o => teams.add(o.primaryOwner.team));
    rules.forEach(r => teams.add(r.team));
    return Array.from(teams);
  }, [ownership, rules]);

  const maxCommits = useMemo(() => {
    return Math.max(...ownership.map(o => o.commitCount), 1);
  }, [ownership]);

  const stats = useMemo(() => {
    const totalFindings = ownership.reduce((sum, o) => sum + o.autoAssignedFindings, 0);
    const totalFiles = ownership.length;
    const teamsCount = uniqueTeams.length;
    return { totalFiles, totalFindings, teamsCount };
  }, [ownership, uniqueTeams]);

  const handleAddRule = useCallback(() => {
    if (newPattern.trim() && newRuleOwner) {
      onAddRule?.(newPattern.trim(), newRuleOwner, newRuleTeam || 'unassigned');
      setNewPattern('');
      setNewRuleOwner('');
      setNewRuleTeam('');
      setShowAddRule(false);
    }
  }, [newPattern, newRuleOwner, newRuleTeam, onAddRule]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 bg-bg-secondary rounded-xl border border-border animate-pulse">
            <div className="h-4 bg-bg-tertiary w-3/4 rounded mb-2" />
            <div className="h-3 bg-bg-tertiary w-1/2 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-fg">{stats.totalFiles}</p>
          <p className="text-xs text-fg-muted">Tracked Files</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-accent">{stats.teamsCount}</p>
          <p className="text-xs text-fg-muted">Teams</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-warning">{stats.totalFindings}</p>
          <p className="text-xs text-fg-muted">Auto-Assigned</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-fg">{rules.length}</p>
          <p className="text-xs text-fg-muted">Ownership Rules</p>
        </Card>
      </div>

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r="7" /><path d="M13 13l4 4" />
              </svg>
              <input
                type="text"
                placeholder="Search files or owners..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Teams' },
                ...uniqueTeams.map(t => ({ value: t, label: t })),
              ]}
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              label="Auto-Assign"
              checked={autoAssign}
              onChange={e => setAutoAssign(e.target.checked)}
              size="sm"
            />
            <Button variant="outline" size="sm" onClick={onRefreshBlame}>
              Refresh Blame
            </Button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
          {(['list', 'tree', 'rules'] as const).map(mode => (
            <button
              key={mode}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                viewMode === mode
                  ? 'bg-accent text-accent-fg'
                  : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
              )}
              onClick={() => setViewMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Auto-Assign Banner */}
      {autoAssign && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm text-accent">Auto-assign enabled — findings are automatically routed to code owners</span>
        </div>
      )}

      {/* Content */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredOwnership.length === 0 ? (
            <Card padding="lg" className="text-center">
              <svg className="w-12 h-12 mx-auto text-fg-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-fg font-medium">No ownership data</p>
              <p className="text-sm text-fg-muted mt-1">Refresh blame data to populate the ownership map.</p>
            </Card>
          ) : (
            filteredOwnership.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl border border-border hover:bg-bg-hover transition-colors cursor-pointer"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className={cn('w-2 h-10 rounded-full', getCommitColor(entry.commitCount))} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-fg font-mono font-medium truncate">{entry.filePath}</span>
                    {entry.autoAssignedFindings > 0 && (
                      <Badge variant="info" size="sm">{entry.autoAssignedFindings} findings</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <OwnerAvatar member={entry.primaryOwner} />
                      <span className="text-xs text-fg-muted">{entry.primaryOwner.name}</span>
                    </div>
                    <span className="text-xs text-fg-muted">{entry.primaryOwner.team}</span>
                    <span className="text-xs text-fg-muted">{formatDate(entry.lastCommitDate)}</span>
                  </div>
                </div>
                <CommitHeatBar count={entry.commitCount} max={maxCommits} />
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'tree' && (
        <Card padding="sm">
          <div className="max-h-[500px] overflow-y-auto">
            <DirectoryTree entries={filteredOwnership} />
          </div>
        </Card>
      )}

      {viewMode === 'rules' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-fg-muted">{rules.length} ownership rules configured</p>
            <Button variant="primary" size="sm" onClick={() => setShowAddRule(true)}>
              Add Rule
            </Button>
          </div>

          {rules.length === 0 ? (
            <Card padding="lg" className="text-center">
              <svg className="w-12 h-12 mx-auto text-fg-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <p className="text-fg font-medium">No ownership rules</p>
              <p className="text-sm text-fg-muted mt-1">Add rules to auto-assign findings based on file patterns.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-3 p-4 bg-bg-secondary rounded-xl border border-border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm text-accent font-mono bg-accent/10 px-2 py-0.5 rounded">{rule.pattern}</code>
                      <span className="text-fg-muted">→</span>
                      <Badge variant="outline" size="sm">{rule.team}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <OwnerAvatar member={rule.owner} />
                      <span className="text-xs text-fg-muted">{rule.owner.name}</span>
                      <span className="text-xs text-fg-muted">Priority: {rule.priority}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => onRemoveRule?.(rule.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Entry Detail Modal */}
      <Modal
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={selectedEntry?.filePath || 'File Ownership'}
        description={`Directory: ${selectedEntry?.directory}`}
        size="lg"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-fg-muted mb-1">Primary Owner</p>
                <div className="flex items-center gap-2 p-3 bg-bg-tertiary rounded-lg">
                  <OwnerAvatar member={selectedEntry.primaryOwner} size="md" />
                  <div>
                    <p className="text-sm text-fg font-medium">{selectedEntry.primaryOwner.name}</p>
                    <p className="text-xs text-fg-muted">{selectedEntry.primaryOwner.team}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Secondary Owners</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {selectedEntry.secondaryOwners.length > 0 ? (
                    selectedEntry.secondaryOwners.map(owner => (
                      <OwnerAvatar key={owner.id} member={owner} />
                    ))
                  ) : (
                    <span className="text-sm text-fg-muted">None</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-lg font-bold text-fg">{selectedEntry.commitCount}</p>
                <p className="text-xs text-fg-muted">Commits</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-lg font-bold text-fg">{selectedEntry.linesChanged}</p>
                <p className="text-xs text-fg-muted">Lines Changed</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-lg font-bold text-info">{selectedEntry.autoAssignedFindings}</p>
                <p className="text-xs text-fg-muted">Auto-Assigned</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-fg-muted mb-1">Last Commit</p>
              <p className="text-sm text-fg font-mono">{selectedEntry.lastCommit.slice(0, 8)} — {formatDate(selectedEntry.lastCommitDate)}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Rule Modal */}
      <Modal
        open={showAddRule}
        onClose={() => setShowAddRule(false)}
        title="Add Ownership Rule"
        description="Auto-assign findings based on file path patterns"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">File Pattern (glob)</label>
            <Input
              placeholder="e.g., src/api/**/*.ts"
              value={newPattern}
              onChange={e => setNewPattern(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Owner</label>
            <Select
              placeholder="Select owner..."
              options={teams.map(t => ({ value: t.id, label: `${t.name} (${t.team})` }))}
              value={newRuleOwner}
              onChange={e => setNewRuleOwner(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Team</label>
            <Input
              placeholder="e.g., Backend Team"
              value={newRuleTeam}
              onChange={e => setNewRuleTeam(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="primary" size="sm" onClick={handleAddRule}>
              Add Rule
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAddRule(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CodeOwnershipMap;

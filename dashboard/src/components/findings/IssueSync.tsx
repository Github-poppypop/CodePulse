import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input, Label } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { Switch } from '../ui/Switch';
import type { Finding, FindingStatus } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SyncDirection = 'to_github' | 'from_github' | 'bidirectional';

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  htmlUrl: string;
  labels: string[];
  assignees: string[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  body: string | null;
}

export interface IssueSyncConfig {
  enabled: boolean;
  direction: SyncDirection;
  autoCreate: boolean;
  autoClose: boolean;
  labelPrefix: string;
  defaultLabels: string[];
  assignOnCreate: boolean;
  commentOnUpdate: boolean;
}

export interface IssueSyncProps {
  finding: Finding;
  linkedIssue: GitHubIssue | null;
  config: IssueSyncConfig;
  onConfigChange: (config: Partial<IssueSyncConfig>) => void;
  onLinkIssue: (issueNumber: number) => Promise<void>;
  onCreateIssue: () => Promise<void>;
  onUnlinkIssue: () => Promise<void>;
  onSyncNow: () => Promise<void>;
  loading?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const statusToIssueState: Record<FindingStatus, string> = {
  OPEN: 'open',
  IN_PROGRESS: 'open',
  FIXED: 'closed',
  IGNORED: 'closed',
  WONT_FIX: 'closed',
};

const directionLabels: Record<SyncDirection, string> = {
  to_github: 'Findings → Issues',
  from_github: 'Issues → Findings',
  bidirectional: 'Bidirectional',
};

const directionDescriptions: Record<SyncDirection, string> = {
  to_github: 'Create GitHub issues from findings. Changes in GitHub won\'t affect findings.',
  from_github: 'Import GitHub issues as findings. Finding changes won\'t sync back.',
  bidirectional: 'Keep findings and issues in sync in both directions.',
};

const SYNC_DIRECTIONS: SyncDirection[] = ['to_github', 'from_github', 'bidirectional'];

// ─── Component ────────────────────────────────────────────────────────────────

export function IssueSync({
  finding,
  linkedIssue,
  config,
  onConfigChange,
  onLinkIssue,
  onCreateIssue,
  onUnlinkIssue,
  onSyncNow,
  loading = false,
  className,
}: IssueSyncProps) {
  const [linkModalOpen, setLinkModalOpen] = React.useState(false);
  const [issueNumber, setIssueNumber] = React.useState('');
  const [linkLoading, setLinkLoading] = React.useState(false);
  const [syncDirection, setSyncDirection] = React.useState<SyncDirection>(config.direction);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(issueNumber, 10);
    if (isNaN(num) || num <= 0) return;
    setLinkLoading(true);
    try {
      await onLinkIssue(num);
      setLinkModalOpen(false);
      setIssueNumber('');
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Sync Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Issue Sync</CardTitle>
              <CardDescription>
                Configure bidirectional synchronization with GitHub Issues.
              </CardDescription>
            </div>
            <Switch
              checked={config.enabled}
              onChange={(e) => onConfigChange({ enabled: e.target.checked })}
              label=""
            />
          </div>
        </CardHeader>

        {config.enabled && (
          <CardContent className="space-y-5">
            {/* Sync Direction */}
            <div>
              <Label>Sync Direction</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {SYNC_DIRECTIONS.map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => {
                      setSyncDirection(dir);
                      onConfigChange({ direction: dir });
                    }}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border text-left transition-colors',
                      syncDirection === dir
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-bg-secondary hover:border-border-hover'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                        syncDirection === dir
                          ? 'border-accent'
                          : 'border-border'
                      )}
                    >
                      {syncDirection === dir && (
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-fg">
                        {directionLabels[dir]}
                      </span>
                      <p className="text-xs text-fg-muted mt-0.5">
                        {directionDescriptions[dir]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-3">
              <Switch
                label="Auto-create issues"
                description="Automatically create GitHub issues for new findings"
                checked={config.autoCreate}
                onChange={(e) => onConfigChange({ autoCreate: e.target.checked })}
              />
              <Switch
                label="Auto-close findings"
                description="Close findings when linked GitHub issues are closed"
                checked={config.autoClose}
                onChange={(e) => onConfigChange({ autoClose: e.target.checked })}
              />
              <Switch
                label="Comment on updates"
                description="Post a comment when finding status changes"
                checked={config.commentOnUpdate}
                onChange={(e) => onConfigChange({ commentOnUpdate: e.target.checked })}
              />
            </div>

            {/* Label Prefix */}
            <div>
              <Label htmlFor="label-prefix">Label Prefix</Label>
              <Input
                id="label-prefix"
                value={config.labelPrefix}
                onChange={(e) => onConfigChange({ labelPrefix: e.target.value })}
                placeholder="codepulse"
                hint="Prefix added to all auto-generated labels"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Linked Issue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Linked Issue</CardTitle>
              <CardDescription>
                {linkedIssue
                  ? 'This finding is linked to a GitHub issue.'
                  : 'No GitHub issue linked to this finding.'}
              </CardDescription>
            </div>
            {config.enabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSyncNow}
                loading={loading}
              >
                Sync Now
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {linkedIssue ? (
            <div className="space-y-4">
              {/* Issue Card */}
              <div className="p-4 rounded-lg bg-bg-secondary border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={linkedIssue.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
                      >
                        #{linkedIssue.number}
                      </a>
                      <span className="text-sm font-medium text-fg truncate">
                        {linkedIssue.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant={linkedIssue.state === 'open' ? 'success' : 'default'}
                        size="sm"
                        dot
                      >
                        {linkedIssue.state}
                      </Badge>
                      {linkedIssue.labels.map((label, i) => (
                        <Badge key={i} variant="outline" size="sm">
                          {label}
                        </Badge>
                      ))}
                      {linkedIssue.assignees.length > 0 && (
                        <span className="text-xs text-fg-muted">
                          Assigned to: {linkedIssue.assignees.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={linkedIssue.state === 'open' ? 'success' : 'default'}
                    size="md"
                  >
                    {linkedIssue.state === 'open' ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </div>

              {/* Sync Status */}
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <svg className="w-3.5 h-3.5 text-success" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Last synced: {new Date(linkedIssue.updatedAt).toLocaleString()}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={linkedIssue.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    View on GitHub
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUnlinkIssue}
                  leftIcon={
                    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  }
                >
                  Unlink
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <svg
                className="w-10 h-10 text-fg-subtle mx-auto mb-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.136-9.136a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              <p className="text-sm text-fg-muted mb-4">
                Link this finding to an existing GitHub issue or create a new one.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  onClick={onCreateIssue}
                  loading={loading}
                  leftIcon={
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                    </svg>
                  }
                >
                  Create Issue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkModalOpen(true)}
                >
                  Link Existing
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Existing Issue Modal */}
      <Modal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Link GitHub Issue"
        description="Enter the issue number to link to this finding."
        size="sm"
      >
        <form onSubmit={handleLink} className="space-y-4">
          <div>
            <Label htmlFor="issue-number" required>
              Issue Number
            </Label>
            <Input
              id="issue-number"
              type="number"
              min="1"
              placeholder="e.g. 42"
              value={issueNumber}
              onChange={(e) => setIssueNumber(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLinkModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={linkLoading}>
              Link Issue
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default IssueSync;

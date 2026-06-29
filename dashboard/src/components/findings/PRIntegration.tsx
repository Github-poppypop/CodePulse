import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input, Label } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import type { Finding, Severity } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PRStatus = 'draft' | 'open' | 'merged' | 'closed' | 'review_required' | 'changes_requested';

export interface PRComment {
  id: string;
  author: string;
  body: string;
  createdAt: string;
  path?: string;
  line?: number;
  isResolved: boolean;
}

export interface PRCheck {
  name: string;
  status: 'pending' | 'success' | 'failure' | 'neutral';
  description?: string;
  url?: string;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  status: PRStatus;
  branch: string;
  baseBranch: string;
  url: string;
  author: string;
  createdAt: string;
  checks: PRCheck[];
  comments: PRComment[];
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface PRIntegrationProps {
  finding: Finding;
  pullRequest: PullRequest | null;
  onCreatePR: (data: PRCreateData) => Promise<void>;
  onUpdatePR?: (prId: string, data: Partial<PullRequest>) => Promise<void>;
  onAddComment?: (prId: string, body: string) => Promise<void>;
  onResolveComment?: (commentId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export interface PRCreateData {
  title: string;
  body: string;
  branch: string;
  baseBranch: string;
  isDraft: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const severityColors: Record<Severity, 'error' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'error',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
  INFO: 'default',
};

const statusConfig: Record<PRStatus, { label: string; variant: 'info' | 'success' | 'error' | 'warning' | 'default'; icon: string }> = {
  draft: { label: 'Draft', variant: 'default', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
  open: { label: 'Open', variant: 'success', icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' },
  merged: { label: 'Merged', variant: 'info', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  closed: { label: 'Closed', variant: 'error', icon: 'M6 18L18 6M6 6l12 12' },
  review_required: { label: 'Review Required', variant: 'warning', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
  changes_requested: { label: 'Changes Requested', variant: 'error', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z' },
};

const checkStatusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: {
    color: 'text-warning',
    icon: <Spinner size="sm" color="fg-muted" />,
  },
  success: {
    color: 'text-success',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
  },
  failure: {
    color: 'text-error',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    ),
  },
  neutral: {
    color: 'text-fg-muted',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
      </svg>
    ),
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PRIntegration({
  finding,
  pullRequest,
  onCreatePR,
  onUpdatePR,
  onAddComment,
  onResolveComment,
  loading = false,
  className,
}: PRIntegrationProps) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState(
    `fix: ${finding.title} [${finding.category}]`
  );
  const [body, setBody] = React.useState(generatePRBody(finding));
  const [branch, setBranch] = React.useState(
    `codepulse/fix/${finding.id.slice(0, 8)}`
  );
  const [baseBranch, setBaseBranch] = React.useState('main');
  const [isDraft, setIsDraft] = React.useState(false);
  const [createLoading, setCreateLoading] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await onCreatePR({ title, body, branch, baseBranch, isDraft });
      setCreateOpen(false);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !pullRequest || !onAddComment) return;
    await onAddComment(pullRequest.id, commentText.trim());
    setCommentText('');
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Finding Summary */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-bg-secondary border border-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={severityColors[finding.severity]} size="sm">
              {finding.severity}
            </Badge>
            <Badge variant="outline" size="sm">
              {finding.category}
            </Badge>
            <span className="text-sm font-medium text-fg truncate">
              {finding.title}
            </span>
          </div>
          {finding.filePath && (
            <p className="text-xs text-fg-muted mt-1">
              {finding.filePath}
              {finding.lineNumber && `:${finding.lineNumber}`}
            </p>
          )}
        </div>
      </div>

      {/* PR Exists */}
      {pullRequest ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>
                  #{pullRequest.number} {pullRequest.title}
                </CardTitle>
                <Badge variant={statusConfig[pullRequest.status].variant} size="md">
                  {statusConfig[pullRequest.status].label}
                </Badge>
              </div>
              <a
                href={pullRequest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:text-accent-hover transition-colors"
              >
                View on GitHub →
              </a>
            </div>
            <CardDescription>
              <span className="font-mono text-xs">{pullRequest.branch}</span>
              {' → '}
              <span className="font-mono text-xs">{pullRequest.baseBranch}</span>
              <span className="mx-2">·</span>
              <span className="text-success text-xs">+{pullRequest.additions}</span>
              {' '}
              <span className="text-error text-xs">-{pullRequest.deletions}</span>
              <span className="mx-2">·</span>
              <span className="text-xs">{pullRequest.changedFiles} files</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Status Checks */}
            {pullRequest.checks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-fg mb-3">Status Checks</h4>
                <div className="space-y-2">
                  {pullRequest.checks.map((check, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-secondary border border-border"
                    >
                      <span className={checkStatusConfig[check.status].color}>
                        {checkStatusConfig[check.status].icon}
                      </span>
                      <span className="text-sm text-fg flex-1">{check.name}</span>
                      {check.url && (
                        <a
                          href={check.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:text-accent-hover"
                        >
                          Details
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review Comments */}
            {pullRequest.comments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-fg mb-3">
                  Review Comments ({pullRequest.comments.length})
                </h4>
                <div className="space-y-3">
                  {pullRequest.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        'p-3 rounded-lg border',
                        comment.isResolved
                          ? 'bg-bg-secondary border-border opacity-60'
                          : 'bg-bg-secondary border-border'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-fg">
                            {comment.author}
                          </span>
                          <span className="text-xs text-fg-subtle">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          {comment.isResolved && (
                            <Badge variant="success" size="sm">Resolved</Badge>
                          )}
                        </div>
                        {!comment.isResolved && onResolveComment && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onResolveComment(comment.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                      {comment.path && (
                        <p className="text-xs text-fg-muted font-mono mb-1">
                          {comment.path}{comment.line && `:${comment.line}`}
                        </p>
                      )}
                      <p className="text-sm text-fg-muted">{comment.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Comment */}
            {onAddComment && (
              <div>
                <Label htmlFor="pr-comment">Add Comment</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    id="pr-comment"
                    placeholder="Write a review comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* No PR - Create Button */
        <Card className="text-center py-8">
          <CardContent>
            <svg
              className="w-12 h-12 text-fg-subtle mx-auto mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <h3 className="text-base font-medium text-fg mb-1">
              No Pull Request Yet
            </h3>
            <p className="text-sm text-fg-muted mb-4 max-w-sm mx-auto">
              Automatically create a pull request with the suggested fix for this finding.
            </p>
            <Button
              onClick={() => setCreateOpen(true)}
              leftIcon={
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              }
            >
              Create Fix PR
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create PR Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Fix Pull Request"
        description="Generate a pull request with the suggested fix."
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <Label htmlFor="pr-title" required>Title</Label>
            <Input
              id="pr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="pr-body">Description</Label>
            <textarea
              id="pr-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className={cn(
                'w-full rounded-lg bg-bg-tertiary border border-border text-fg placeholder-fg-subtle resize-y',
                'transition-all duration-150 px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent'
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pr-branch" required>Branch</Label>
              <Input
                id="pr-branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="pr-base">Base Branch</Label>
              <Input
                id="pr-base"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isDraft}
              onClick={() => setIsDraft(!isDraft)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isDraft ? 'bg-accent' : 'bg-bg-tertiary border border-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isDraft ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className="text-sm text-fg">Create as draft</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createLoading}>
              Create Pull Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generatePRBody(finding: Finding): string {
  const lines = [
    `## 🤖 Auto-fix: ${finding.title}`,
    '',
    `**Severity:** ${finding.severity}`,
    `**Category:** ${finding.category}`,
    '',
    '### Description',
    finding.description,
    '',
  ];

  if (finding.filePath) {
    lines.push('### Location', `\`${finding.filePath}\``, '');
  }

  if (finding.suggestedFix) {
    lines.push('### Suggested Fix', '```', finding.suggestedFix, '```', '');
  }

  lines.push(
    '---',
    '*This pull request was automatically generated by CodePulse.*'
  );

  return lines.join('\n');
}

export default PRIntegration;

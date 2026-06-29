import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import type { GitHubRepo } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GitHubPermissionScope {
  resource: string;
  scope: 'read' | 'write' | 'admin';
  description: string;
  required: boolean;
}

export interface GitHubAppInstallProps {
  appName?: string;
  appDescription?: string;
  appUrl?: string;
  avatarUrl?: string;
  permissions: GitHubPermissionScope[];
  repositories: GitHubRepo[];
  selectedRepos: string[];
  onRepoToggle: (repoId: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onInstall: () => Promise<void>;
  onCancel?: () => void;
  installing?: boolean;
  error?: string | null;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const scopeLabels: Record<string, { label: string; color: 'success' | 'warning' | 'error' }> = {
  read: { label: 'Read', color: 'success' },
  write: { label: 'Write', color: 'warning' },
  admin: { label: 'Admin', color: 'error' },
};

const defaultPermissions: GitHubPermissionScope[] = [
  { resource: 'Pull requests', scope: 'read', description: 'View pull requests and comments', required: true },
  { resource: 'Pull requests', scope: 'write', description: 'Create and comment on PRs with fixes', required: false },
  { resource: 'Issues', scope: 'read', description: 'Read issue details and comments', required: true },
  { resource: 'Issues', scope: 'write', description: 'Create and update issues for findings', required: false },
  { resource: 'Contents', scope: 'read', description: 'Read repository code and files', required: true },
  { resource: 'Contents', scope: 'write', description: 'Push commits with automated fixes', required: false },
  { resource: 'Metadata', scope: 'read', description: 'Access repository metadata', required: true },
  { resource: 'Checks', scope: 'write', description: 'Report status checks on commits', required: false },
  { resource: 'Webhooks', scope: 'write', description: 'Receive push and PR events', required: false },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function GitHubAppInstall({
  appName = 'CodePulse',
  appDescription = 'AI-powered code analysis, automated fixes, and security scanning for your repositories.',
  appUrl = 'https://codepulse.dev',
  avatarUrl,
  permissions = defaultPermissions,
  repositories,
  selectedRepos,
  onRepoToggle,
  onSelectAll,
  onSelectNone,
  onInstall,
  onCancel,
  installing = false,
  error = null,
  className,
}: GitHubAppInstallProps) {
  const [step, setStep] = React.useState<'permissions' | 'repos'>('permissions');
  const allSelected = selectedRepos.length === repositories.length && repositories.length > 0;

  const handleInstall = async () => {
    await onInstall();
  };

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      {/* App Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={appName} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-fg">{appName}</h1>
          <p className="text-sm text-fg-muted mt-0.5 max-w-md">{appDescription}</p>
          {appUrl && (
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:text-accent-hover transition-colors"
            >
              {appUrl}
            </a>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3 mb-6">
        <StepIndicator
          step={1}
          label="Permissions"
          active={step === 'permissions'}
          completed={step === 'repos'}
        />
        <div className="flex-1 h-px bg-border" />
        <StepIndicator
          step={2}
          label="Repositories"
          active={step === 'repos'}
          completed={false}
        />
      </div>

      {/* Step Content */}
      {step === 'permissions' ? (
        <Card>
          <CardHeader>
            <CardTitle>Requested Permissions</CardTitle>
            <CardDescription>
              {appName} requests the following permissions. Required permissions cannot be disabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {permissions.map((perm, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg',
                    'bg-bg-secondary border border-border'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fg">
                        {perm.resource}
                      </span>
                      <Badge
                        variant={scopeLabels[perm.scope].color}
                        size="sm"
                      >
                        {scopeLabels[perm.scope].label}
                      </Badge>
                      {perm.required && (
                        <Badge variant="outline" size="sm">
                          Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-fg-muted mt-0.5">
                      {perm.description}
                    </p>
                  </div>
                  {perm.required && (
                    <svg className="w-4 h-4 text-fg-subtle flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              className="ml-auto"
              onClick={() => setStep('repos')}
              rightIcon={
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Continue
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select Repositories</CardTitle>
            <CardDescription>
              Choose which repositories {appName} can access. You can change this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Select All / None */}
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={allSelected ? onSelectNone : onSelectAll}
              >
                {allSelected ? 'Select None' : 'Select All'}
              </Button>
              <span className="text-xs text-fg-muted">
                {selectedRepos.length} of {repositories.length} selected
              </span>
            </div>

            {/* Repo List */}
            <div className="border border-border rounded-lg divide-y divide-border max-h-[320px] overflow-y-auto">
              {repositories.length === 0 ? (
                <div className="p-6 text-center text-sm text-fg-muted">
                  No repositories available
                </div>
              ) : (
                repositories.map((repo) => {
                  const repoId = String(repo.id);
                  const isSelected = selectedRepos.includes(repoId);
                  return (
                    <button
                      key={repoId}
                      type="button"
                      onClick={() => onRepoToggle(repoId)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'bg-accent/5'
                          : 'hover:bg-bg-hover'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                          isSelected
                            ? 'bg-accent border-accent'
                            : 'border-border'
                        )}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-accent-fg" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-fg truncate">
                            {repo.full_name}
                          </span>
                          {repo.private && (
                            <Badge variant="outline" size="sm">
                              Private
                            </Badge>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-fg-muted truncate mt-0.5">
                            {repo.description}
                          </p>
                        )}
                      </div>
                      {repo.language && (
                        <Badge variant="default" size="sm">
                          {repo.language}
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/30">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" onClick={() => setStep('permissions')}>
              Back
            </Button>
            <Button
              className="ml-auto"
              loading={installing}
              disabled={selectedRepos.length === 0}
              onClick={handleInstall}
            >
              Install App
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

// ─── Step Indicator Sub-component ─────────────────────────────────────────────

interface StepIndicatorProps {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ step, label, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
          completed && 'bg-success text-white',
          active && 'bg-accent text-accent-fg',
          !active && !completed && 'bg-bg-tertiary text-fg-muted border border-border'
        )}
      >
        {completed ? (
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          step
        )}
      </div>
      <span
        className={cn(
          'text-sm font-medium',
          active ? 'text-fg' : 'text-fg-muted'
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default GitHubAppInstall;

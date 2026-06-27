import * as React from 'react';
import { cn } from '../../utils/cn';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Select } from '../ui/Select';
import { Skeleton } from '../ui/Spinner';

interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  branch: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    findings: number;
    runs: number;
  };
  lastRun?: {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
  };
}

interface RepoCardProps {
  repo: Repository;
  onClick?: () => void;
  loading?: boolean;
}

export function RepoCard({ repo, onClick, loading }: RepoCardProps) {
  if (loading) {
    return (
      <Card variant="default" padding="md" className="animate-pulse">
        <Skeleton variant="rectangular" width="100%" height={40} />
        <Skeleton variant="rectangular" width="60%" height={20} />
        <Skeleton variant="rectangular" width="100%" height={60} />
      </Card>
    );
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="px-2 py-1 text-xs font-medium bg-green/20 text-green rounded-full">{status}</span>;
      case 'RUNNING': return <span className="px-2 py-1 text-xs font-medium bg-blue/20 text-blue rounded-full">{status}</span>;
      case 'FAILED': return <span className="px-2 py-1 text-xs font-medium bg-red/20 text-red rounded-full">{status}</span>;
      case 'PENDING': return <span className="px-2 py-1 text-xs font-medium bg-yellow/20 text-yellow rounded-full">{status}</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-gray/20 text-gray rounded-full">No runs</span>;
    }
  };

  return (
    <div className="p-6 bg-card-bg border border-border rounded-xl transition-all duration-200 hover:border-accent/50 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-medium">
            {repo.owner[0]}{repo.name[0]}
          </div>
          <div>
            <h3 className="font-semibold text-fg">{repo.owner}/{repo.name}</h3>
            <p className="text-sm text-fg-muted">{repo.url}</p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-accent/20 text-accent rounded-full">{repo.branch}</span>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {repo.lastRun ? <span className="px-2 py-1 text-xs font-medium bg-green/20 text-green rounded-full">{repo.lastRun.status}</span> : <span className="px-2 py-1 text-xs font-medium bg-gray/20 text-gray rounded-full">No runs</span>}
        <span className="px-2 py-1 text-xs font-medium bg-red/20 text-red rounded-full">0 Critical</span>
        <span className="px-2 py-1 text-xs font-medium bg-red/20 text-red rounded-full">0 High</span>
        <span className="px-2 py-1 text-xs font-medium bg-yellow/20 text-yellow rounded-full">0 Medium</span>
        <span className="px-2 py-1 text-xs font-medium bg-blue/20 text-blue rounded-full">0 Low</span>
      </div>

      <div className="flex items-center justify-between text-sm text-fg-muted border-t border-border pt-4">
        <span>Updated: {new Date(repo.updatedAt).toLocaleDateString()}</span>
        <select className="px-2 py-1 text-xs bg-bg-tertiary border border-border rounded-lg text-fg">
          <option value={repo.branch}>{repo.branch}</option>
        </select>
      </div>

      {repo.lastRun && (
        <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center justify-between text-xs text-fg-muted mb-1">
            <span>Last run: {new Date(repo.lastRun.startedAt).toLocaleString()}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-green/20 text-green rounded">{repo.lastRun.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{repo.lastRun.id.slice(0, 8)}</span>
            {repo.lastRun.completedAt && (
              <span className="text-fg-muted">({new Date(repo.lastRun.completedAt).toLocaleString()})</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RepoGridProps {
  repos: any[];
  loading?: boolean;
  onRepoClick?: (repo: any) => void;
  emptyMessage?: string;
}

export function RepoGrid({ repos, loading, onRepoClick, emptyMessage = 'No repositories connected yet.' }: any) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-3 p-6 bg-card-bg border border-border rounded-xl">
            <div className="h-6 bg-bg-tertiary w-3/4 rounded" />
            <div className="h-4 bg-bg-tertiary w-1/2 rounded" />
            <div className="h-8 bg-bg-tertiary w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
        <div className="text-4xl mb-4">📦</div>
        <p className="text-fg-muted mb-4">{emptyMessage}</p>
        <button className="px-4 py-2 bg-accent text-accent-fg rounded-lg font-medium" onClick={() => window.location.href = '/repos/connect'}>
          Connect Your First Repository
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {repos.map((repo) => (
        <div key={repo.id}>
          <RepoCardWithData repo={repo} onClick={() => onRepoClick?.(repo)} />
        </div>
      ))}
    </div>
  );
}

function RepoCardWithData({ repo, onClick }: { repo: any; onClick?: () => void }) {
  return (
    <div className="p-6 bg-card-bg border border-border rounded-xl transition-all duration-200 hover:border-accent/50 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-medium">
            {repo.owner[0]}{repo.name[0]}
          </div>
          <div>
            <h3 className="font-semibold text-fg">{repo.owner}/{repo.name}</h3>
            <p className="text-sm text-fg-muted">{repo.url}</p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-accent/20 text-accent rounded-full">{repo.branch}</span>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="px-2 py-1 text-xs font-medium bg-green/20 text-green rounded-full">No runs</span>
      </div>

      <div className="flex items-center justify-between text-sm text-fg-muted border-t border-border pt-4">
        <span>Updated: {new Date(repo.updatedAt).toLocaleDateString()}</span>
        <select className="px-2 py-1 text-xs bg-bg-tertiary border border-border rounded-lg text-fg">
          <option value={repo.branch}>{repo.branch}</option>
        </select>
      </div>
    </div>
  );
}
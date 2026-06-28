import * as React from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Select } from '../ui/Select';
import { Skeleton } from '../ui/Spinner';
import { Tooltip } from '../ui/Tooltip';
import type { Run, RunStatus, Severity } from '../../types';

interface RunCardProps {
  run: {
    id: string;
    repositoryId: string;
    repository?: { name: string; owner: string };
    status: RunStatus;
    startedAt: string;
    completedAt: string | null;
    trigger: string;
    commitSha: string | null;
    branch: string | null;
    findingsCount?: number;
  };
  onClick?: () => void;
  loading?: boolean;
}

export function RunCard({ run, onClick, loading }: any) {
  if (loading) {
    return (
      <div className="p-6 bg-card-bg border border-border rounded-xl animate-pulse space-y-3">
        <div className="h-6 bg-bg-tertiary w-3/4 rounded" />
        <div className="h-4 bg-bg-tertiary w-1/2 rounded" />
        <div className="h-8 bg-bg-tertiary w-full rounded" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="px-2 py-1 text-xs font-medium bg-green/20 text-green rounded-full">{status}</span>;
      case 'RUNNING': return <span className="px-2 py-1 text-xs font-medium bg-blue/20 text-blue rounded-full">{status}</span>;
      case 'FAILED': return <span className="px-2 py-1 text-xs font-medium bg-red/20 text-red rounded-full">{status}</span>;
      case 'PENDING': return <span className="px-2 py-1 text-xs font-medium bg-yellow/20 text-yellow rounded-full">{status}</span>;
      case 'CANCELLED': return <span className="px-2 py-1 text-xs font-medium bg-gray/20 text-gray rounded-full">{status}</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-gray/20 text-gray rounded-full">{status}</span>;
    }
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="p-6 bg-card-bg border border-border rounded-xl transition-all duration-200 hover:border-accent/50 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-medium">
            {run.repository?.owner?.[0] || '?'}{run.repository?.name?.[0] || '?'}
          </div>
          <div>
            <h3 className="font-semibold text-fg">{run.repository?.owner || 'Unknown'}/{run.repository?.name || 'Unknown'}</h3>
            <p className="text-sm text-fg-muted">Triggered by {run.trigger}</p>
          </div>
        </div>
        {getStatusBadge(run.status)}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap text-sm text-fg-muted">
        <span className="px-2 py-1 bg-bg-tertiary rounded-lg font-mono">
          {run.commitSha ? run.commitSha.slice(0, 8) : 'No commit'}
        </span>
        <span className="px-2 py-1 bg-bg-tertiary rounded-lg">
          {run.branch || 'main'}
        </span>
        {run.findingsCount !== undefined && (
          <span className="px-2 py-1 bg-bg-tertiary rounded-lg">
            {run.findingsCount} findings
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-fg-muted border-t border-border pt-4">
        <span>Started: {new Date(run.startedAt).toLocaleString()}</span>
        <span>
          Duration: {formatDuration(run.startedAt, run.completedAt)}
        </span>
      </div>

      {run.completedAt && (
        <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center justify-between text-xs text-fg-muted">
            <span>Completed: {new Date(run.completedAt).toLocaleString()}</span>
            <span className="px-2 py-0.5 text-xs font-medium bg-green/20 text-green rounded">Duration: {formatDuration(run.startedAt, run.completedAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface RunGridProps {
  runs: any[];
  loading?: boolean;
  onRunClick?: (run: any) => void;
  emptyMessage?: string;
}

export function RunGrid({ runs, loading, onRunClick, emptyMessage = 'No runs yet.' }: any) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 bg-card-bg border border-border rounded-xl animate-pulse space-y-3">
            <div className="h-6 bg-bg-tertiary w-3/4 rounded" />
            <div className="h-4 bg-bg-tertiary w-1/2 rounded" />
            <div className="h-8 bg-bg-tertiary w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
        <div className="text-4xl mb-4">▶️</div>
        <p className="text-fg-muted mb-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {runs.map((run) => (
        <RunCardWithData key={run.id} run={run} onClick={() => onRunClick?.(run)} />
      ))}
    </div>
  );
}

function RunCardWithData({ run, onClick }: { run: any; onClick?: () => void }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="px-2 py-1 text-xs font-medium bg-green/20 text-green rounded-full">{status}</span>;
      case 'RUNNING': return <span className="px-2 py-1 text-xs font-medium bg-blue/20 text-blue rounded-full">{status}</span>;
      case 'FAILED': return <span className="px-2 py-1 text-xs font-medium bg-red/20 text-red rounded-full">{status}</span>;
      case 'PENDING': return <span className="px-2 py-1 text-xs font-medium bg-yellow/20 text-yellow rounded-full">{status}</span>;
      case 'CANCELLED': return <span className="px-2 py-1 text-xs font-medium bg-gray/20 text-gray rounded-full">{status}</span>;
      default: return <span className="px-2 py-1 text-xs font-medium bg-gray/20 text-gray rounded-full">{status}</span>;
    }
  };

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="p-6 bg-card-bg border border-border rounded-xl transition-all duration-200 hover:border-accent/50 cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-medium">
            ?
          </div>
          <div>
            <h3 className="font-semibold text-fg">Repository</h3>
            <p className="text-sm text-fg-muted">Triggered by manual</p>
          </div>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-green/20 text-green rounded-full">COMPLETED</span>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap text-sm text-fg-muted">
        <span className="px-2 py-1 bg-bg-tertiary rounded-lg font-mono">abc12345</span>
        <span className="px-2 py-1 bg-bg-tertiary rounded-lg">main</span>
        <span className="px-2 py-1 bg-bg-tertiary rounded-lg">5 findings</span>
      </div>

      <div className="flex items-center justify-between text-sm text-fg-muted border-t border-border pt-4">
        <span>Started: 1/15/2025, 2:30:00 PM</span>
        <span>Duration: 2m 30s</span>
      </div>

      <div className="mt-4 p-3 bg-bg-tertiary rounded-lg">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span>Completed: 1/15/2025, 2:32:30 PM</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-green/20 text-green rounded">Duration: 2m 30s</span>
        </div>
      </div>
    </div>
  );
}
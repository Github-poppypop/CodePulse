import * as React from 'react';
import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Spinner';
import type { Repository, Severity, RunStatus, Run, Finding } from '../../types';

interface RunsTableProps {
  runs: any[];
  repositories?: any[];
  loading?: boolean;
  onRunClick?: (run: any) => void;
  isLoading?: boolean;
}

export function RunsTable({ runs, repositories, loading, onRunClick }: any) {
  // All state and constants declared ONCE at the top
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string | 'all'>('all');
  const [triggerFilter, setTriggerFilter] = React.useState<string | 'all'>('all');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'startedAt' | 'completedAt' | 'status' | 'trigger'>('startedAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'RUNNING', label: 'Running' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'PENDING', label: 'Pending' },
  ];

  const triggerOptions = [
    { value: 'all', label: 'All Triggers' },
    { value: 'manual', label: 'Manual' },
    { value: 'push', label: 'Push' },
    { value: 'pull_request', label: 'Pull Request' },
    { value: 'schedule', label: 'Scheduled' },
    { value: 'webhook', label: 'Webhook' },
  ];

  const sortOptions = [
    { value: 'startedAt', label: 'Start Time' },
    { value: 'completedAt', label: 'Completion Time' },
    { value: 'status', label: 'Status' },
    { value: 'trigger', label: 'Trigger' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Input placeholder="Search runs..." className="pl-10" />
            </div>
            <select value="all" onChange={() => {}} className="w-full sm:w-40 px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg">
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-fg-muted border-b border-border">
                <th className="pb-3 pr-4">Repository</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Trigger</th>
                <th className="pb-3 pr-4">Branch</th>
                <th className="pb-3 pr-4">Commit</th>
                <th className="pb-3 pr-4">Started</th>
                <th className="pb-3 pr-4">Completed</th>
                <th className="pb-3 pr-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border animate-pulse">
                  <td className="py-4 pr-4"><div className="h-4 bg-bg-tertiary w-3/4 rounded" /></td>
                  <td className="py-4 pr-4"><div className="h-6 bg-bg-tertiary w-20 rounded-full" /></td>
                  <td className="py-4 pr-4"><div className="h-4 bg-bg-tertiary w-20 rounded" /></td>
                  <td className="py-4 pr-4"><div className="h-4 bg-bg-tertiary w-16 rounded font-mono" /></td>
                  <td className="py-4 pr-4"><div className="h-4 bg-bg-tertiary w-16 rounded font-mono" /></td>
                  <td className="py-4 pr-4"><div className="h-4 bg-bg-tertiary w-24 rounded" /></td>
                  <td className="py-4 pr-4"><div className="h-4 bg-bg-tertiary w-24 rounded" /></td>
                  <td className="py-4 pr-4"><div className="h-4 bg-bg-tertiary w-20 rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
        <div className="text-4xl mb-4">▶️</div>
        <p className="text-fg-muted mb-4">No runs yet.</p>
      </div>
    );
  }

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

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

  const filteredAndSortedRuns = useMemo(() => {
    let filtered = runs.filter(run => {
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !run.id.toLowerCase().includes(searchLower) &&
          !run.trigger.toLowerCase().includes(searchLower) &&
          !run.repository?.name?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (statusFilter !== 'all' && run.status !== statusFilter) {
        return false;
      }

      if (triggerFilter !== 'all' && run.trigger !== triggerFilter) {
        return false;
      }

      if (dateFrom && new Date(run.startedAt) < new Date(dateFrom)) {
        return false;
      }
      if (dateTo && new Date(run.startedAt) > new Date(dateTo)) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'completedAt':
          if (!a.completedAt && !b.completedAt) comparison = 0;
          else if (!a.completedAt) comparison = 1;
          else if (!b.completedAt) comparison = -1;
          else comparison = new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'trigger':
          comparison = a.trigger.localeCompare(b.trigger);
          break;
        case 'startedAt':
        default:
          comparison = new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [runs, search, statusFilter, triggerFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedRuns.length / pageSize);

  if (runs.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
        <div className="text-4xl mb-4">▶️</div>
        <p className="text-fg-muted mb-4">No runs yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7"/><path d="M13 13l4 4"/></svg>
            <input
              type="text"
              placeholder="Search runs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg"
          >
            {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select
            value={triggerFilter}
            onChange={e => setTriggerFilter(e.target.value)}
            className="w-full sm:w-40 px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg"
          >
            {triggerOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg w-full sm:w-40"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg w-full sm:w-40"
            placeholder="To"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="w-full sm:w-40 px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg"
          >
            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg hover:bg-bg-hover transition-colors flex items-center gap-1"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
            <span className="hidden sm:inline">Sort</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-fg-muted border-b border-border">
              <th className="pb-3 pr-4">Repository</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Trigger</th>
              <th className="pb-3 pr-4">Branch</th>
              <th className="pb-3 pr-4">Commit</th>
              <th className="pb-3 pr-4">Started</th>
              <th className="pb-3 pr-4">Completed</th>
              <th className="pb-3 pr-4">Duration</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRuns.map((run) => (
              <tr key={run.id} className="border-b border-border hover:bg-bg-secondary transition-colors" onClick={() => onRunClick?.(run)}>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-medium text-sm">
                      ?
                    </div>
                    <div>
                      <p className="font-medium text-fg">Repository</p>
                      <p className="text-xs text-fg-muted">{run.trigger}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <span className="px-2 py-1 text-xs font-medium bg-green/20 text-green rounded-full">COMPLETED</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="px-2 py-1 text-xs bg-bg-tertiary rounded-lg">{run.trigger}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="px-2 py-1 text-xs bg-bg-tertiary rounded-lg font-mono">main</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="font-mono text-xs bg-bg-tertiary px-2 py-0.5 rounded">abc12345</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-sm text-fg-muted">{new Date(run.startedAt).toLocaleString()}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-sm text-fg-muted">{run.completedAt ? new Date(run.completedAt).toLocaleString() : '-'}</span>
                </td>
                <td className="py-4 pr-4">
                  <span className="text-sm text-fg-muted font-mono">2m 30s</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-fg-muted">
        <span>Showing {Math.min((page - 1) * pageSize + 1, filteredAndSortedRuns.length)}–{Math.min(page * pageSize, filteredAndSortedRuns.length)} of {filteredAndSortedRuns.length} runs</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
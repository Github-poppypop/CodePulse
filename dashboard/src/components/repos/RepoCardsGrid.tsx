import * as React from 'react';
import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select, SelectOption } from '../ui/Select';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Spinner';
import { RepoCard } from './RepoCard';
import type { Repository, Severity, RunStatus, Run, Finding } from '../../types';

interface RepoCardsGridProps {
  repositories: Repository[];
  runs: Run[];
  findings: Finding[];
  onViewDetail: (repoId: string) => void;
  onTriggerRun: (repoId: string, branch?: string) => void;
  onBranchChange: (repoId: string, branch: string) => void;
  isLoading?: boolean;
}

export function RepoCardsGrid({ 
  repositories, 
  runs, 
  findings, 
  onViewDetail, 
  onTriggerRun, 
  onBranchChange,
  isLoading
}: RepoCardsGridProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<RunStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = React.useState<Severity | 'all'>('all');
  const [languageFilter, setLanguageFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'updatedAt' | 'name' | 'lastRun' | 'findings'>('updatedAt');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Get last run for each repo
  const lastRuns = useMemo(() => {
    const map = new Map<string, Run | null>();
    runs.forEach(run => {
      const existing = map.get(run.repositoryId);
      if (!existing || new Date(run.startedAt) > new Date(existing.startedAt)) {
        map.set(run.repositoryId, run);
      }
    });
    return map;
  }, [runs]);

  // Get finding counts by severity for each repo
  const findingCountsByRepo = useMemo(() => {
    const map = new Map<string, Record<Severity, number>>();
    findings.forEach(finding => {
      if (!map.has(finding.repositoryId)) {
        map.set(finding.repositoryId, { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 });
      }
      const counts = map.get(finding.repositoryId)!;
      counts[finding.severity]++;
    });
    return map;
  }, [findings]);

  // Get all languages across repos
  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    repositories.forEach(repo => {
      Object.keys(repo.languages || {}).forEach(l => langs.add(l));
    });
    return Array.from(langs).sort();
  }, [repositories]);

  const filteredAndSortedRepos = useMemo(() => {
    let filtered = repositories.filter(repo => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (
          !repo.name.toLowerCase().includes(searchLower) &&
          !repo.owner.toLowerCase().includes(searchLower) &&
          !repo.fullName.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all') {
        const lastRun = lastRuns.get(repo.id);
        if (!lastRun || lastRun.status !== statusFilter) {
          return false;
        }
      }

      // Severity filter
      if (severityFilter !== 'all') {
        const counts = findingCountsByRepo.get(repo.id);
        if (!counts || counts[severityFilter] === 0) {
          return false;
        }
      }

      // Language filter
      if (languageFilter !== 'all') {
        if (!repo.languages || !repo.languages[languageFilter]) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'lastRun': {
          const runA = lastRuns.get(a.id);
          const runB = lastRuns.get(b.id);
          if (!runA && !runB) comparison = 0;
          else if (!runA) comparison = 1;
          else if (!runB) comparison = -1;
          else comparison = new Date(runB.startedAt).getTime() - new Date(runA.startedAt).getTime();
          break;
        }
        case 'findings': {
          const countA = findingCountsByRepo.get(a.id);
          const countB = findingCountsByRepo.get(b.id);
          const totalA = countA ? Object.values(countA).reduce((a, b) => a + b, 0) : 0;
          const totalB = countB ? Object.values(countB).reduce((a, b) => a + b, 0) : 0;
          comparison = totalB - totalA;
          break;
        }
        case 'updatedAt':
        default:
          comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [repositories, search, statusFilter, severityFilter, languageFilter, sortBy, sortOrder, lastRuns, findingCountsByRepo]);

  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'RUNNING', label: 'Running' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'PENDING', label: 'Pending' },
  ];

  const severityOptions: SelectOption[] = [
    { value: 'all', label: 'All Severities' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
    { value: 'INFO', label: 'Info' },
  ];

  const languageOptions: SelectOption[] = [
    { value: 'all', label: 'All Languages' },
    ...allLanguages.map(lang => ({ value: lang, label: lang })),
  ];

  const sortOptions: SelectOption[] = [
    { value: 'updatedAt', label: 'Recently Updated' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'lastRun', label: 'Last Run' },
    { value: 'findings', label: 'Most Findings' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-6 bg-card-bg border border-border rounded-xl animate-pulse space-y-3">
            <div className="h-6 bg-bg-tertiary w-3/4 rounded" />
            <div className="h-4 bg-bg-tertiary w-1/2 rounded" />
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-bg-tertiary w-20 rounded" />
              <div className="h-6 bg-bg-tertiary w-20 rounded" />
              <div className="h-6 bg-bg-tertiary w-20 rounded" />
            </div>
            <div className="h-8 bg-bg-tertiary w-24 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredAndSortedRepos.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-medium text-fg mb-2">No repositories found</h3>
        <p className="text-fg-muted mb-4">
          {search ? 'Try adjusting your search or filters' : 'Connect your first repository to get started'}
        </p>
        {search && (
          <button className="px-4 py-2 text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors" onClick={() => setSearch('')}>
            Clear search
          </button>
        )}
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
            <Input
              placeholder="Search repositories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as RunStatus | 'all')}
            options={statusOptions}
            className="w-full sm:w-40"
          />
          <Select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as Severity | 'all')}
            options={severityOptions}
            className="w-full sm:w-40"
          />
          <Select
            value={languageFilter}
            onChange={e => setLanguageFilter(e.target.value)}
            options={languageOptions}
            className="w-full sm:w-40"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            options={sortOptions}
            className="w-full sm:w-40"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
            <span className="hidden sm:inline">Sort</span>
          </Button>
        </div>
      </div>

      {/* Repo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAndSortedRepos.map(repo => (
          <div key={repo.id}>
            <RepoCardWithData repo={repo} />
          </div>
        ))}
      </div>

      {/* Results count */}
      <div className="text-sm text-fg-muted text-center py-2">
        Showing {filteredAndSortedRepos.length} of {repositories.length} repositories
      </div>
    </div>
  );
}

function RepoCardWithData({ repo }: { repo: any }) {
  return (
    <div className="p-6 bg-card-bg border border-border rounded-xl transition-all duration-200 hover:border-accent/50 cursor-pointer">
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
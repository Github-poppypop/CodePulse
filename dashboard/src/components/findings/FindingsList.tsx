import * as React from 'react';
import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import type { Finding, Severity } from '../../types';

interface FindingsListProps {
  findings: Finding[];
  loading?: boolean;
  onFindingClick?: (finding: Finding) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
}

type GroupBy = 'none' | 'severity' | 'category' | 'file' | 'status';

export function FindingsList({ findings, loading, onFindingClick, onBulkAction }: FindingsListProps) {
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('severity');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      if (search && !f.title.toLowerCase().includes(search.toLowerCase()) && !f.filePath?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (severityFilter !== 'all' && f.severity !== severityFilter) {
        return false;
      }
      return true;
    });
  }, [findings, search, severityFilter]);

  const groupedFindings = useMemo(() => {
    if (groupBy === 'none') return { 'All Findings': filteredFindings };

    const groups: Record<string, Finding[]> = {};
    filteredFindings.forEach(f => {
      let key = '';
      switch (groupBy) {
        case 'severity': key = f.severity; break;
        case 'category': key = f.category; break;
        case 'file': key = f.filePath || 'Unknown'; break;
        case 'status': key = f.status || 'new'; break;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });
    return groups;
  }, [filteredFindings, groupBy]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFindings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFindings.map(f => f.id)));
    }
  };

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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between p-4 bg-bg-secondary rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7"/><path d="M13 13l4 4"/></svg>
            <input
              type="text"
              placeholder="Search findings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as Severity | 'all')}
            className="w-full sm:w-36 px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg"
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="INFO">Info</option>
          </select>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value as GroupBy)}
            className="w-full sm:w-36 px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg"
          >
            <option value="none">No Grouping</option>
            <option value="severity">By Severity</option>
            <option value="category">By Category</option>
            <option value="file">By File</option>
            <option value="status">By Status</option>
          </select>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-muted">{selectedIds.size} selected</span>
            <Button variant="primary" size="xs" onClick={() => onBulkAction?.('accept', Array.from(selectedIds))}>Accept</Button>
            <Button variant="outline" size="xs" onClick={() => onBulkAction?.('reject', Array.from(selectedIds))}>Reject</Button>
          </div>
        )}
      </div>

      {/* Select All */}
      <div className="flex items-center gap-3 px-1">
        <Checkbox checked={selectedIds.size === filteredFindings.length && filteredFindings.length > 0} onChange={toggleSelectAll} label={`Select all (${filteredFindings.length})`} />
      </div>

      {/* Grouped Findings */}
      <div className="space-y-6">
        {Object.entries(groupedFindings).map(([group, groupFindings]) => (
          <div key={group}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-medium text-fg">{group}</h4>
              <span className="text-xs text-fg-muted bg-bg-tertiary px-2 py-0.5 rounded-full">{groupFindings.length}</span>
            </div>
            <div className="space-y-2">
              {groupFindings.map(finding => (
                <div
                  key={finding.id}
                  className={cn(
                    'flex items-start gap-3 p-4 bg-bg-secondary rounded-xl border transition-colors cursor-pointer',
                    selectedIds.has(finding.id) ? 'border-accent bg-accent/5' : 'border-border hover:bg-bg-hover'
                  )}
                  onClick={() => onFindingClick?.(finding)}
                >
                  <Checkbox
                    checked={selectedIds.has(finding.id)}
                    onChange={() => toggleSelect(finding.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={finding.severity} />
                      <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded-full">{finding.category}</span>
                      {finding.confidence && (
                        <span className="text-xs text-fg-muted font-mono">{finding.confidence}%</span>
                      )}
                    </div>
                    <p className="text-sm text-fg font-medium truncate">{finding.title}</p>
                    <p className="text-xs text-fg-muted mt-0.5">{finding.filePath}:{finding.lineStart ?? finding.lineNumber}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="xs">Fix</Button>
                    <Button variant="ghost" size="xs">Skip</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red/20 text-red',
    HIGH: 'bg-orange/20 text-orange',
    MEDIUM: 'bg-yellow/20 text-yellow',
    LOW: 'bg-blue/20 text-blue',
    INFO: 'bg-gray/20 text-gray',
  };
  return (
    <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded-full', colors[severity] || colors.INFO)}>
      {severity}
    </span>
  );
}

import * as React from 'react';
import { useState, useMemo } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ScrollArea } from '../ui/ScrollArea';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LiveLogsViewerProps {
  logs: LogEntry[];
  maxHeight?: number;
  onClear?: () => void;
}

export function LiveLogsViewer({ logs, maxHeight = 600, onClear }: LiveLogsViewerProps) {
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [follow, setFollow] = useState(true);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) return false;
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
      return true;
    });
  }, [logs, filter, levelFilter, sourceFilter]);

  const sources = useMemo(() => {
    const srcs = new Set(logs.map(l => l.source));
    return Array.from(srcs);
  }, [logs]);

  const levelColors = {
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    debug: 'text-gray-400',
  };

  const levelBgColors = {
    info: 'bg-blue-400/10',
    warn: 'bg-yellow-400/10',
    error: 'bg-red-400/10',
    debug: 'bg-gray-400/10',
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle>Live Logs</CardTitle>
          <div className={cn('w-2 h-2 rounded-full', follow ? 'bg-green animate-pulse' : 'bg-gray')} />
          <Badge>{filteredLogs.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={follow ? 'primary' : 'ghost'} size="xs" onClick={() => setFollow(!follow)}>
            {follow ? '⏸ Pause' : '▶ Follow'}
          </Button>
          <Button variant="ghost" size="xs" onClick={onClear}>Clear</Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {/* Filters */}
        <div className="flex gap-2 p-3 border-b border-border">
          <Input placeholder="Filter logs..." value={filter} onChange={e => setFilter(e.target.value)} className="flex-1" />
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)} className="px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg">
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg">
            <option value="all">All Sources</option>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Log List */}
        <ScrollArea className="p-3 font-mono text-xs" style={{ maxHeight }}>
          <div className="space-y-1">
            {filteredLogs.map(log => (
              <div key={log.id} className={cn('flex gap-3 px-2 py-1 rounded', levelBgColors[log.level])}>
                <span className="text-fg-muted shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className={cn('shrink-0 w-12 uppercase font-medium', levelColors[log.level])}>{log.level}</span>
                <span className="text-accent shrink-0 w-24 truncate">[{log.source}]</span>
                <span className="text-fg flex-1 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
}

export function MetricCard({ title, value, change, changeLabel, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-fg-muted">{title}</span>
          {icon && <span className="text-lg">{icon}</span>}
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-fg">{value}</span>
          {change !== undefined && (
            <span className={cn('text-xs mb-1', change >= 0 ? 'text-green' : 'text-red')}>
              {change >= 0 ? '↑' : '↓'}{Math.abs(change)}%
            </span>
          )}
        </div>
        {changeLabel && <p className="text-xs text-fg-muted mt-1">{changeLabel}</p>}
      </CardContent>
    </Card>
  );
}

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}

interface AuditTrailProps {
  entries: AuditEntry[];
  onExport?: () => void;
}

export function AuditTrail({ entries, onExport }: AuditTrailProps) {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (search && !e.actor.toLowerCase().includes(search.toLowerCase()) && !e.resource.toLowerCase().includes(search.toLowerCase())) return false;
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      return true;
    });
  }, [entries, search, actionFilter]);

  const actions = useMemo(() => Array.from(new Set(entries.map(e => e.action))), [entries]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-fg">Audit Trail</h3>
          <p className="text-sm text-fg-muted">Immutable record of all actions</p>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>Export CSV</Button>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search actors or resources..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-2 py-1 text-sm bg-bg-tertiary border border-border rounded-lg text-fg">
          <option value="all">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.slice(0, 50).map(entry => (
              <div key={entry.id} className="flex items-center gap-4 p-4">
                <div className="shrink-0">
                  <p className="text-sm font-medium text-fg">{entry.actor}</p>
                  <p className="text-xs text-fg-muted">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
                <div className="flex-1">
                  <Badge>{entry.action}</Badge>
                  <p className="text-sm text-fg mt-1">{entry.resource}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

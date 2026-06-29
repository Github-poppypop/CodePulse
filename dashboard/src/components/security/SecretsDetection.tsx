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

export type SecretSeverity = 'critical' | 'high' | 'medium' | 'low';
export type SecretStatus = 'detected' | 'redacted' | 'whitelisted' | 'resolved';

export interface SecretFinding {
  id: string;
  type: string;
  severity: SecretSeverity;
  filePath: string;
  line: number;
  rawValue: string;
  redactedValue: string;
  status: SecretStatus;
  detectedAt: string;
  commit?: string;
  author?: string;
}

export interface ScanConfig {
  scanHistory: boolean;
  scanLogs: boolean;
  autoRedact: boolean;
  entropyThreshold: number;
  customPatterns: string[];
  excludePaths: string[];
}

interface SecretsDetectionProps {
  findings?: SecretFinding[];
  config?: ScanConfig;
  scanning?: boolean;
  onStartScan?: () => void;
  onRedact?: (ids: string[]) => void;
  onWhitelist?: (ids: string[]) => void;
  onResolve?: (ids: string[]) => void;
  onConfigChange?: (config: ScanConfig) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: ScanConfig = {
  scanHistory: true,
  scanLogs: true,
  autoRedact: true,
  entropyThreshold: 4.5,
  customPatterns: [],
  excludePaths: ['node_modules', '.git', 'dist', 'build'],
};

const SEVERITY_ORDER: Record<SecretSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function severityVariant(severity: SecretSeverity) {
  switch (severity) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'default';
  }
}

function redactValue(value: string): string {
  if (value.length <= 8) return '****';
  return value.slice(0, 3) + '•'.repeat(Math.min(value.length - 6, 12)) + value.slice(-3);
}

// ─── Components ──────────────────────────────────────────────────────────────

function SecretTypeIcon({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    'AWS Key': 'text-yellow',
    'GitHub Token': 'text-purple',
    'Slack Token': 'text-green',
    'Private Key': 'text-red',
    'API Key': 'text-orange',
    'Password': 'text-blue',
    'Connection String': 'text-cyan',
    'Generic Secret': 'text-gray',
  };
  return (
    <span className={cn('text-xs font-mono font-bold', colorMap[type] || 'text-gray')}>
      {type.charAt(0).toUpperCase()}
    </span>
  );
}

function EntropyBar({ value, threshold }: { value: number; threshold: number }) {
  const pct = Math.min((value / 6) * 100, 100);
  const isHigh = value >= threshold;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isHigh ? 'bg-error' : 'bg-success'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn('text-xs font-mono', isHigh ? 'text-error' : 'text-success')}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SecretsDetection({
  findings = [],
  config = DEFAULT_CONFIG,
  scanning = false,
  onStartScan,
  onRedact,
  onWhitelist,
  onResolve,
  onConfigChange,
}: SecretsDetectionProps) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<SecretSeverity | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SecretStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailFinding, setDetailFinding] = useState<SecretFinding | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [customPattern, setCustomPattern] = useState('');

  const filteredFindings = useMemo(() => {
    return findings
      .filter(f => {
        if (search && !f.type.toLowerCase().includes(search.toLowerCase()) && !f.filePath.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
        if (statusFilter !== 'all' && f.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [findings, search, severityFilter, statusFilter]);

  const stats = useMemo(() => {
    const byStatus: Record<SecretStatus, number> = { detected: 0, redacted: 0, whitelisted: 0, resolved: 0 };
    findings.forEach(f => byStatus[f.status]++);
    return { total: findings.length, ...byStatus };
  }, [findings]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredFindings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFindings.map(f => f.id)));
    }
  }, [selectedIds.size, filteredFindings]);

  const addCustomPattern = useCallback(() => {
    if (customPattern.trim()) {
      onConfigChange?.({ ...config, customPatterns: [...config.customPatterns, customPattern.trim()] });
      setCustomPattern('');
    }
  }, [customPattern, config, onConfigChange]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-fg">{stats.total}</p>
          <p className="text-xs text-fg-muted">Total Secrets</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-error">{stats.detected}</p>
          <p className="text-xs text-fg-muted">Detected</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-success">{stats.redacted}</p>
          <p className="text-xs text-fg-muted">Auto-Redacted</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-warning">{stats.whitelisted}</p>
          <p className="text-xs text-fg-muted">Whitelisted</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-accent">{stats.resolved}</p>
          <p className="text-xs text-fg-muted">Resolved</p>
        </Card>
      </div>

      {/* Toolbar */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r="7" /><path d="M13 13l4 4" />
              </svg>
              <input
                type="text"
                placeholder="Search by type or file path..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Severities' },
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value as SecretSeverity | 'all')}
              className="w-full sm:w-40"
            />
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'detected', label: 'Detected' },
                { value: 'redacted', label: 'Redacted' },
                { value: 'whitelisted', label: 'Whitelisted' },
                { value: 'resolved', label: 'Resolved' },
              ]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as SecretStatus | 'all')}
              className="w-full sm:w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
              Config
            </Button>
            <Button variant="primary" size="sm" loading={scanning} onClick={onStartScan}>
              {scanning ? 'Scanning...' : 'Scan Now'}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-fg-muted">{selectedIds.size} selected</span>
            <Button variant="danger" size="xs" onClick={() => onRedact?.(Array.from(selectedIds))}>
              Redact
            </Button>
            <Button variant="outline" size="xs" onClick={() => onWhitelist?.(Array.from(selectedIds))}>
              Whitelist
            </Button>
            <Button variant="ghost" size="xs" onClick={() => onResolve?.(Array.from(selectedIds))}>
              Mark Resolved
            </Button>
          </div>
        )}
      </Card>

      {/* Auto-Redact Banner */}
      {config.autoRedact && (
        <div className="flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/30 rounded-lg">
          <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm text-success">Auto-redact enabled — secrets are masked in UI and logs</span>
        </div>
      )}

      {/* Findings List */}
      <div className="space-y-2">
        {/* Select All */}
        <div className="flex items-center gap-3 px-1">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredFindings.length && filteredFindings.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent focus:ring-accent"
          />
          <span className="text-xs text-fg-muted">Select all ({filteredFindings.length})</span>
        </div>

        {filteredFindings.length === 0 ? (
          <Card padding="lg" className="text-center">
            <svg className="w-12 h-12 mx-auto text-success mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-fg font-medium">No secrets detected</p>
            <p className="text-sm text-fg-muted mt-1">Your codebase is clean or no secrets match the current filters.</p>
          </Card>
        ) : (
          filteredFindings.map(finding => (
            <div
              key={finding.id}
              className={cn(
                'flex items-start gap-3 p-4 bg-bg-secondary rounded-xl border transition-colors cursor-pointer',
                selectedIds.has(finding.id) ? 'border-accent bg-accent/5' : 'border-border hover:bg-bg-hover'
              )}
              onClick={() => setDetailFinding(finding)}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(finding.id)}
                onChange={() => toggleSelect(finding.id)}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 mt-1 rounded border-border bg-bg-tertiary text-accent focus:ring-accent"
              />
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                finding.severity === 'critical' ? 'bg-error/15' :
                finding.severity === 'high' ? 'bg-warning/15' :
                finding.severity === 'medium' ? 'bg-accent/15' : 'bg-bg-tertiary'
              )}>
                <SecretTypeIcon type={finding.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={severityVariant(finding.severity)} size="sm">
                    {finding.severity}
                  </Badge>
                  <span className="text-xs font-medium text-fg">{finding.type}</span>
                  <Badge
                    variant={finding.status === 'redacted' ? 'success' : finding.status === 'whitelisted' ? 'warning' : finding.status === 'resolved' ? 'info' : 'default'}
                    size="sm"
                  >
                    {finding.status}
                  </Badge>
                </div>
                <p className="text-sm text-fg font-mono truncate">
                  {config.autoRedact ? finding.redactedValue : finding.rawValue}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-fg-muted">{finding.filePath}:{finding.line}</span>
                  {finding.commit && (
                    <span className="text-xs text-fg-muted font-mono">{finding.commit.slice(0, 7)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <EntropyBar value={calculateEntropy(finding.rawValue)} threshold={config.entropyThreshold} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailFinding}
        onClose={() => setDetailFinding(null)}
        title={detailFinding?.type || 'Secret Detail'}
        description={`${detailFinding?.filePath}:${detailFinding?.line}`}
        size="lg"
      >
        {detailFinding && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-fg-muted mb-1">Severity</p>
                <Badge variant={severityVariant(detailFinding.severity)}>{detailFinding.severity}</Badge>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Status</p>
                <Badge variant={detailFinding.status === 'redacted' ? 'success' : 'default'}>{detailFinding.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Detected At</p>
                <p className="text-sm text-fg font-mono">{detailFinding.detectedAt}</p>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Commit</p>
                <p className="text-sm text-fg font-mono">{detailFinding.commit || 'N/A'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-fg-muted mb-1">Redacted Value</p>
              <div className="p-3 bg-bg-tertiary rounded-lg font-mono text-sm text-fg break-all">
                {detailFinding.redactedValue}
              </div>
            </div>

            <div>
              <p className="text-xs text-fg-muted mb-1">Entropy Score</p>
              <EntropyBar value={calculateEntropy(detailFinding.rawValue)} threshold={config.entropyThreshold} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="danger" size="sm" onClick={() => { onRedact?.([detailFinding.id]); setDetailFinding(null); }}>
                Redact
              </Button>
              <Button variant="outline" size="sm" onClick={() => { onWhitelist?.([detailFinding.id]); setDetailFinding(null); }}>
                Whitelist
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { onResolve?.([detailFinding.id]); setDetailFinding(null); }}>
                Mark Resolved
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Config Modal */}
      <Modal
        open={showConfig}
        onClose={() => setShowConfig(false)}
        title="Scanner Configuration"
        description="Configure secret detection behavior"
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <Switch
              label="Scan Git History"
              description="Scan all commits for secrets (TruffleHog-style deep scan)"
              checked={config.scanHistory}
              onChange={e => onConfigChange?.({ ...config, scanHistory: e.target.checked })}
            />
            <Switch
              label="Scan Logs"
              description="Scan application logs for leaked secrets"
              checked={config.scanLogs}
              onChange={e => onConfigChange?.({ ...config, scanLogs: e.target.checked })}
            />
            <Switch
              label="Auto-Redact"
              description="Automatically mask detected secrets in UI and logs"
              checked={config.autoRedact}
              onChange={e => onConfigChange?.({ ...config, autoRedact: e.target.checked })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Entropy Threshold</label>
            <input
              type="range"
              min="3"
              max="6"
              step="0.1"
              value={config.entropyThreshold}
              onChange={e => onConfigChange?.({ ...config, entropyThreshold: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-fg-muted mt-1">Current: {config.entropyThreshold} (higher = fewer false positives)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Custom Patterns (Regex)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom regex pattern..."
                value={customPattern}
                onChange={e => setCustomPattern(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomPattern()}
              />
              <Button variant="outline" size="sm" onClick={addCustomPattern}>Add</Button>
            </div>
            {config.customPatterns.length > 0 && (
              <div className="mt-2 space-y-1">
                {config.customPatterns.map((pattern, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg">
                    <code className="text-xs text-fg font-mono">{pattern}</code>
                    <button
                      className="text-xs text-error hover:text-error-hover"
                      onClick={() => onConfigChange?.({
                        ...config,
                        customPatterns: config.customPatterns.filter((_, idx) => idx !== i),
                      })}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Excluded Paths</label>
            <div className="flex flex-wrap gap-2">
              {config.excludePaths.map((path, i) => (
                <Badge key={i} variant="outline" size="sm">
                  {path}
                  <button
                    className="ml-1 text-fg-muted hover:text-error"
                    onClick={() => onConfigChange?.({
                      ...config,
                      excludePaths: config.excludePaths.filter((_, idx) => idx !== i),
                    })}
                  >
                    x
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const freq: Record<string, number> = {};
  for (const ch of str) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export default SecretsDetection;

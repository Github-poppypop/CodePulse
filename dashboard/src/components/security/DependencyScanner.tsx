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

export type VulnSeverity = 'critical' | 'high' | 'medium' | 'low';
export type VulnSource = 'osv' | 'github-advisory' | 'npm-audit' | 'pip-audit';
export type FixStatus = 'open' | 'auto-fixed' | 'pr-pending' | 'pr-merged' | 'ignored';

export interface Vulnerability {
  id: string;
  package: string;
  currentVersion: string;
  fixedVersion: string;
  severity: VulnSeverity;
  cve?: string;
  summary: string;
  source: VulnSource;
  status: FixStatus;
  cvssScore?: number;
  exploitAvailable: boolean;
  prUrl?: string;
  publishedAt: string;
}

export interface DependencyScannerConfig {
  autoPR: boolean;
  autoMergePatch: boolean;
  scanOnPush: boolean;
  failOnSeverity: VulnSeverity;
  ignoreDevDeps: boolean;
  allowedRegistries: string[];
}

interface DependencyScannerProps {
  vulnerabilities?: Vulnerability[];
  config?: DependencyScannerConfig;
  scanning?: boolean;
  onStartScan?: () => void;
  onAutoFix?: (ids: string[]) => void;
  onCreatePR?: (ids: string[]) => void;
  onIgnore?: (ids: string[]) => void;
  onConfigChange?: (config: DependencyScannerConfig) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: DependencyScannerConfig = {
  autoPR: true,
  autoMergePatch: false,
  scanOnPush: true,
  failOnSeverity: 'high',
  ignoreDevDeps: false,
  allowedRegistries: ['npm', 'pypi', 'maven', 'nuget', 'go', 'crates.io'],
};

const SEVERITY_ORDER: Record<VulnSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function severityVariant(severity: VulnSeverity) {
  switch (severity) {
    case 'critical': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'default';
  }
}

function sourceLabel(source: VulnSource): string {
  switch (source) {
    case 'osv': return 'OSV';
    case 'github-advisory': return 'GitHub Advisory';
    case 'npm-audit': return 'npm audit';
    case 'pip-audit': return 'pip audit';
  }
}

function statusVariant(status: FixStatus) {
  switch (status) {
    case 'open': return 'error';
    case 'auto-fixed': return 'success';
    case 'pr-pending': return 'info';
    case 'pr-merged': return 'success';
    case 'ignored': return 'default';
  }
}

// ─── Components ──────────────────────────────────────────────────────────────

function CVSSBadge({ score }: { score: number }) {
  const color = score >= 9 ? 'text-error' : score >= 7 ? 'text-warning' : score >= 4 ? 'text-info' : 'text-success';
  return (
    <span className={cn('text-xs font-mono font-bold', color)}>
      {score.toFixed(1)}
    </span>
  );
}

function ExploitBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-error/15 text-error rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      Exploit
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function DependencyScanner({
  vulnerabilities = [],
  config = DEFAULT_CONFIG,
  scanning = false,
  onStartScan,
  onAutoFix,
  onCreatePR,
  onIgnore,
  onConfigChange,
}: DependencyScannerProps) {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<VulnSeverity | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<VulnSource | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<FixStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailVuln, setDetailVuln] = useState<Vulnerability | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  const filteredVulns = useMemo(() => {
    return vulnerabilities
      .filter(v => {
        if (search && !v.package.toLowerCase().includes(search.toLowerCase()) && !v.cve?.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        if (severityFilter !== 'all' && v.severity !== severityFilter) return false;
        if (sourceFilter !== 'all' && v.source !== sourceFilter) return false;
        if (statusFilter !== 'all' && v.status !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [vulnerabilities, search, severityFilter, sourceFilter, statusFilter]);

  const stats = useMemo(() => {
    const bySeverity: Record<VulnSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    const byStatus: Record<FixStatus, number> = { open: 0, 'auto-fixed': 0, 'pr-pending': 0, 'pr-merged': 0, ignored: 0 };
    let exploitCount = 0;
    vulnerabilities.forEach(v => {
      bySeverity[v.severity]++;
      byStatus[v.status]++;
      if (v.exploitAvailable) exploitCount++;
    });
    return { total: vulnerabilities.length, bySeverity, byStatus, exploitCount };
  }, [vulnerabilities]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredVulns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVulns.map(v => v.id)));
    }
  }, [selectedIds.size, filteredVulns]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-fg">{stats.total}</p>
          <p className="text-xs text-fg-muted">Total Vulns</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-error">{stats.bySeverity.critical}</p>
          <p className="text-xs text-fg-muted">Critical</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-warning">{stats.bySeverity.high}</p>
          <p className="text-xs text-fg-muted">High</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-accent">{stats.exploitCount}</p>
          <p className="text-xs text-fg-muted">With Exploit</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-success">{stats.byStatus['auto-fixed'] + stats.byStatus['pr-merged']}</p>
          <p className="text-xs text-fg-muted">Auto-Fixed</p>
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
                placeholder="Search by package or CVE..."
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
              onChange={e => setSeverityFilter(e.target.value as VulnSeverity | 'all')}
              className="w-full sm:w-36"
            />
            <Select
              options={[
                { value: 'all', label: 'All Sources' },
                { value: 'osv', label: 'OSV' },
                { value: 'github-advisory', label: 'GitHub Advisory' },
                { value: 'npm-audit', label: 'npm audit' },
                { value: 'pip-audit', label: 'pip audit' },
              ]}
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value as VulnSource | 'all')}
              className="w-full sm:w-40"
            />
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'open', label: 'Open' },
                { value: 'auto-fixed', label: 'Auto-Fixed' },
                { value: 'pr-pending', label: 'PR Pending' },
                { value: 'pr-merged', label: 'PR Merged' },
                { value: 'ignored', label: 'Ignored' },
              ]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as FixStatus | 'all')}
              className="w-full sm:w-36"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
              Config
            </Button>
            <Button variant="primary" size="sm" loading={scanning} onClick={onStartScan}>
              {scanning ? 'Scanning...' : 'Scan Dependencies'}
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-fg-muted">{selectedIds.size} selected</span>
            <Button variant="primary" size="xs" onClick={() => onAutoFix?.(Array.from(selectedIds))}>
              Auto-Fix
            </Button>
            <Button variant="outline" size="xs" onClick={() => onCreatePR?.(Array.from(selectedIds))}>
              Create PR
            </Button>
            <Button variant="ghost" size="xs" onClick={() => onIgnore?.(Array.from(selectedIds))}>
              Ignore
            </Button>
          </div>
        )}
      </Card>

      {/* Auto-PR Banner */}
      {config.autoPR && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm text-accent">Auto-PR enabled — fixable vulnerabilities will automatically generate pull requests</span>
        </div>
      )}

      {/* Vulnerabilities List */}
      <div className="space-y-2">
        {/* Select All */}
        <div className="flex items-center gap-3 px-1">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredVulns.length && filteredVulns.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent focus:ring-accent"
          />
          <span className="text-xs text-fg-muted">Select all ({filteredVulns.length})</span>
        </div>

        {filteredVulns.length === 0 ? (
          <Card padding="lg" className="text-center">
            <svg className="w-12 h-12 mx-auto text-success mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <p className="text-fg font-medium">No known vulnerabilities</p>
            <p className="text-sm text-fg-muted mt-1">All dependencies are up to date and secure.</p>
          </Card>
        ) : (
          filteredVulns.map(vuln => (
            <div
              key={vuln.id}
              className={cn(
                'flex items-start gap-3 p-4 bg-bg-secondary rounded-xl border transition-colors cursor-pointer',
                selectedIds.has(vuln.id) ? 'border-accent bg-accent/5' : 'border-border hover:bg-bg-hover'
              )}
              onClick={() => setDetailVuln(vuln)}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(vuln.id)}
                onChange={() => toggleSelect(vuln.id)}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 mt-1 rounded border-border bg-bg-tertiary text-accent focus:ring-accent"
              />
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                vuln.severity === 'critical' ? 'bg-error/15' :
                vuln.severity === 'high' ? 'bg-warning/15' :
                vuln.severity === 'medium' ? 'bg-accent/15' : 'bg-bg-tertiary'
              )}>
                <svg className="w-4 h-4 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={severityVariant(vuln.severity)} size="sm">
                    {vuln.severity}
                  </Badge>
                  <span className="text-xs font-medium text-fg">{sourceLabel(vuln.source)}</span>
                  <Badge variant={statusVariant(vuln.status)} size="sm">
                    {vuln.status}
                  </Badge>
                  {vuln.exploitAvailable && <ExploitBadge />}
                </div>
                <p className="text-sm text-fg font-medium">
                  <span className="font-mono">{vuln.package}</span>
                  <span className="text-fg-muted mx-1">@</span>
                  <span className="font-mono text-fg-muted">{vuln.currentVersion}</span>
                  <span className="text-fg-muted mx-1">→</span>
                  <span className="font-mono text-success">{vuln.fixedVersion}</span>
                </p>
                <p className="text-xs text-fg-muted mt-1 truncate">{vuln.summary}</p>
                <div className="flex items-center gap-3 mt-1">
                  {vuln.cve && (
                    <span className="text-xs text-fg-muted font-mono">{vuln.cve}</span>
                  )}
                  {vuln.cvssScore !== undefined && <CVSSBadge score={vuln.cvssScore} />}
                  {vuln.prUrl && (
                    <a href={vuln.prUrl} className="text-xs text-accent hover:underline" onClick={e => e.stopPropagation()}>
                      View PR
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailVuln}
        onClose={() => setDetailVuln(null)}
        title={detailVuln?.package || 'Vulnerability Detail'}
        description={detailVuln?.cve}
        size="lg"
      >
        {detailVuln && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-fg-muted mb-1">Severity</p>
                <Badge variant={severityVariant(detailVuln.severity)}>{detailVuln.severity}</Badge>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Source</p>
                <Badge variant="outline">{sourceLabel(detailVuln.source)}</Badge>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">CVSS Score</p>
                {detailVuln.cvssScore !== undefined ? <CVSSBadge score={detailVuln.cvssScore} /> : <span className="text-sm text-fg-muted">N/A</span>}
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Exploit Available</p>
                {detailVuln.exploitAvailable ? <ExploitBadge /> : <span className="text-sm text-success">No</span>}
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Current Version</p>
                <p className="text-sm text-fg font-mono">{detailVuln.currentVersion}</p>
              </div>
              <div>
                <p className="text-xs text-fg-muted mb-1">Fixed Version</p>
                <p className="text-sm text-success font-mono">{detailVuln.fixedVersion}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-fg-muted mb-1">Summary</p>
              <p className="text-sm text-fg">{detailVuln.summary}</p>
            </div>

            <div>
              <p className="text-xs text-fg-muted mb-1">Published</p>
              <p className="text-sm text-fg font-mono">{detailVuln.publishedAt}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => { onAutoFix?.([detailVuln.id]); setDetailVuln(null); }}>
                Auto-Fix
              </Button>
              <Button variant="outline" size="sm" onClick={() => { onCreatePR?.([detailVuln.id]); setDetailVuln(null); }}>
                Create PR
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { onIgnore?.([detailVuln.id]); setDetailVuln(null); }}>
                Ignore
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Config Modal */}
      <Modal
        open={showConfig}
        onClose={() => setShowConfig(false)}
        title="Dependency Scanner Configuration"
        description="Configure SCA integration behavior"
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <Switch
              label="Auto-PR for Updates"
              description="Automatically create pull requests for fixable vulnerabilities"
              checked={config.autoPR}
              onChange={e => onConfigChange?.({ ...config, autoPR: e.target.checked })}
            />
            <Switch
              label="Auto-Merge Patch Updates"
              description="Automatically merge patch-level updates that pass CI"
              checked={config.autoMergePatch}
              onChange={e => onConfigChange?.({ ...config, autoMergePatch: e.target.checked })}
            />
            <Switch
              label="Scan on Push"
              description="Run dependency scan on every push to main"
              checked={config.scanOnPush}
              onChange={e => onConfigChange?.({ ...config, scanOnPush: e.target.checked })}
            />
            <Switch
              label="Ignore Dev Dependencies"
              description="Skip scanning devDependencies"
              checked={config.ignoreDevDeps}
              onChange={e => onConfigChange?.({ ...config, ignoreDevDeps: e.target.checked })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Fail Pipeline On</label>
            <Select
              options={[
                { value: 'low', label: 'Low and above' },
                { value: 'medium', label: 'Medium and above' },
                { value: 'high', label: 'High and above' },
                { value: 'critical', label: 'Critical only' },
              ]}
              value={config.failOnSeverity}
              onChange={e => onConfigChange?.({ ...config, failOnSeverity: e.target.value as VulnSeverity })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Allowed Registries</label>
            <div className="flex flex-wrap gap-2">
              {config.allowedRegistries.map((reg, i) => (
                <Badge key={i} variant="outline" size="sm">
                  {reg}
                  <button
                    className="ml-1 text-fg-muted hover:text-error"
                    onClick={() => onConfigChange?.({
                      ...config,
                      allowedRegistries: config.allowedRegistries.filter((_, idx) => idx !== i),
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

export default DependencyScanner;

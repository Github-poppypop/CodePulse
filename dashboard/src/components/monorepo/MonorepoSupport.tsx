import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

interface MonorepoPackage {
  id: string;
  name: string;
  path: string;
  language: string;
  dependencies: string[];
  findings: number;
  lastRun: string;
  config: PackageConfig;
}

interface PackageConfig {
  enabled: boolean;
  categories: string[];
  severityThreshold: string;
  customRules: string[];
  excludePatterns: string[];
}

interface WorkspaceConfig {
  rootDir: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun';
  sharedTools: string[];
  pathFilters: string[];
  ignorePatterns: string[];
  parallelRuns: number;
  cacheStrategy: 'local' | 'remote' | 'both';
}

const mockPackages: MonorepoPackage[] = [
  { id: 'p1', name: '@monorepo/web', path: 'packages/web', language: 'TypeScript', dependencies: ['@monorepo/shared', '@monorepo/ui'], findings: 12, lastRun: '2 hours ago', config: { enabled: true, categories: ['BUG', 'SECURITY', 'PERFORMANCE'], severityThreshold: 'MEDIUM', customRules: [], excludePatterns: ['**/*.test.ts'] } },
  { id: 'p2', name: '@monorepo/api', path: 'packages/api', language: 'TypeScript', dependencies: ['@monorepo/shared', '@monorepo/db'], findings: 8, lastRun: '1 hour ago', config: { enabled: true, categories: ['BUG', 'SECURITY'], severityThreshold: 'LOW', customRules: ['no-console'], excludePatterns: [] } },
  { id: 'p3', name: '@monorepo/shared', path: 'packages/shared', language: 'TypeScript', dependencies: [], findings: 3, lastRun: '3 hours ago', config: { enabled: true, categories: ['BUG', 'TYPE_SAFETY'], severityThreshold: 'LOW', customRules: [], excludePatterns: [] } },
  { id: 'p4', name: '@monorepo/ui', path: 'packages/ui', language: 'TypeScript', dependencies: ['@monorepo/shared'], findings: 5, lastRun: '4 hours ago', config: { enabled: true, categories: ['BUG', 'STYLE', 'ACCESSIBILITY'], severityThreshold: 'MEDIUM', customRules: [], excludePatterns: ['**/stories/**'] } },
  { id: 'p5', name: '@monorepo/db', path: 'packages/db', language: 'TypeScript', dependencies: [], findings: 2, lastRun: '5 hours ago', config: { enabled: true, categories: ['BUG', 'SECURITY'], severityThreshold: 'HIGH', customRules: [], excludePatterns: ['**/migrations/**'] } },
  { id: 'p6', name: '@monorepo/docs', path: 'apps/docs', language: 'MDX', dependencies: ['@monorepo/ui'], findings: 0, lastRun: '1 day ago', config: { enabled: false, categories: [], severityThreshold: 'LOW', customRules: [], excludePatterns: [] } },
];

const workspaceConfig: WorkspaceConfig = {
  rootDir: '/projects/monorepo',
  packageManager: 'pnpm',
  sharedTools: ['ESLint', 'Prettier', 'TypeScript', 'Jest'],
  pathFilters: ['packages/*', 'apps/*'],
  ignorePatterns: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  parallelRuns: 4,
  cacheStrategy: 'both',
};

export function MonorepoSupport() {
  const [packages, setPackages] = React.useState<MonorepoPackage[]>(mockPackages);
  const [config, setConfig] = React.useState<WorkspaceConfig>(workspaceConfig);
  const [selectedPackage, setSelectedPackage] = React.useState<MonorepoPackage | null>(null);
  const [pathFilter, setPathFilter] = React.useState('');
  const [showAddFilter, setShowAddFilter] = React.useState(false);
  const [newFilter, setNewFilter] = React.useState('');

  const filteredPackages = packages.filter(p =>
    p.path.toLowerCase().includes(pathFilter.toLowerCase()) ||
    p.name.toLowerCase().includes(pathFilter.toLowerCase())
  );

  const togglePackageEnabled = (id: string) => {
    setPackages(packages.map(p =>
      p.id === id ? { ...p, config: { ...p.config, enabled: !p.config.enabled } } : p
    ));
  };

  const addPathFilter = () => {
    if (newFilter.trim()) {
      setConfig({ ...config, pathFilters: [...config.pathFilters, newFilter.trim()] });
      setNewFilter('');
      setShowAddFilter(false);
    }
  };

  const removePathFilter = (index: number) => {
    setConfig({ ...config, pathFilters: config.pathFilters.filter((_, i) => i !== index) });
  };

  const totalFindings = packages.reduce((sum, p) => sum + p.findings, 0);
  const activePackages = packages.filter(p => p.config.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Monorepo Support</h2>
          <p className="text-sm text-fg-muted mt-1">Path filtering, per-package config, shared tooling, workspace-aware</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{config.packageManager}</Badge>
          <Badge variant="info">{activePackages}/{packages.length} packages active</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Total Packages</div>
          <div className="text-2xl font-bold text-fg">{packages.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Active Packages</div>
          <div className="text-2xl font-bold text-green">{activePackages}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Total Findings</div>
          <div className="text-2xl font-bold text-fg">{totalFindings}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Parallel Runs</div>
          <div className="text-2xl font-bold text-accent">{config.parallelRuns}</div>
        </Card>
      </div>

      {/* Workspace Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Root Directory</label>
                <input
                  type="text"
                  value={config.rootDir}
                  onChange={e => setConfig({ ...config, rootDir: e.target.value })}
                  className="w-full rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm font-mono"
                />
              </div>
              <Select
                label="Package Manager"
                options={[
                  { value: 'npm', label: 'npm' },
                  { value: 'yarn', label: 'Yarn' },
                  { value: 'pnpm', label: 'pnpm' },
                  { value: 'bun', label: 'Bun' },
                ]}
                value={config.packageManager}
                onChange={e => setConfig({ ...config, packageManager: e.target.value as WorkspaceConfig['packageManager'] })}
              />
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Parallel Runs</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={config.parallelRuns}
                  onChange={e => setConfig({ ...config, parallelRuns: parseInt(e.target.value) })}
                  className="w-full rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Path Filters</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {config.pathFilters.map((filter, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded-md font-mono">
                      {filter}
                      <button onClick={() => removePathFilter(i)} className="hover:text-red">×</button>
                    </span>
                  ))}
                </div>
                {showAddFilter ? (
                  <div className="flex gap-2">
                    <Input value={newFilter} onChange={e => setNewFilter(e.target.value)} placeholder="e.g., packages/*" />
                    <Button size="sm" onClick={addPathFilter}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddFilter(false)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setShowAddFilter(true)}>+ Add Filter</Button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Ignore Patterns</label>
                <div className="flex flex-wrap gap-2">
                  {config.ignorePatterns.map((pattern, i) => (
                    <span key={i} className="px-2 py-1 bg-bg-tertiary text-fg-muted text-xs rounded-md font-mono">
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
              <Select
                label="Cache Strategy"
                options={[
                  { value: 'local', label: 'Local Only' },
                  { value: 'remote', label: 'Remote Only' },
                  { value: 'both', label: 'Local + Remote' },
                ]}
                value={config.cacheStrategy}
                onChange={e => setConfig({ ...config, cacheStrategy: e.target.value as WorkspaceConfig['cacheStrategy'] })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shared Tooling */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Tooling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {config.sharedTools.map(tool => (
              <Badge key={tool} variant="info" size="lg">{tool}</Badge>
            ))}
            <button className="px-3 py-1.5 border border-dashed border-border rounded-full text-xs text-fg-muted hover:border-accent hover:text-accent transition-colors">
              + Add Tool
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Packages Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Packages</CardTitle>
          <Input
            placeholder="Filter packages..."
            value={pathFilter}
            onChange={e => setPathFilter(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Package</th>
                  <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Path</th>
                  <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Findings</th>
                  <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Last Run</th>
                  <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Threshold</th>
                  <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Enabled</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map(pkg => (
                  <tr
                    key={pkg.id}
                    className="border-b border-border/50 hover:bg-bg-hover cursor-pointer"
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-fg">{pkg.name}</span>
                        <Badge variant="outline" size="sm">{pkg.language}</Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-fg-muted">{pkg.path}</td>
                    <td className="py-3 px-4">
                      <span className={cn('text-sm font-medium', pkg.findings > 0 ? 'text-yellow' : 'text-green')}>
                        {pkg.findings}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-fg-muted">{pkg.lastRun}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={pkg.config.severityThreshold === 'HIGH' ? 'error' : pkg.config.severityThreshold === 'MEDIUM' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {pkg.config.severityThreshold}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Switch
                        checked={pkg.config.enabled}
                        onChange={(e) => { e.stopPropagation(); togglePackageEnabled(pkg.id); }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Package Detail */}
      {selectedPackage && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedPackage.name}</CardTitle>
              <div className="text-xs text-fg-muted mt-1">{selectedPackage.path}</div>
            </div>
            <button onClick={() => setSelectedPackage(null)} className="text-fg-muted hover:text-fg">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-10 10M5 5l10 10" /></svg>
            </button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Dependencies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.dependencies.length > 0 ? selectedPackage.dependencies.map(dep => (
                    <Badge key={dep} variant="outline" size="sm">{dep}</Badge>
                  )) : (
                    <span className="text-xs text-fg-muted">No dependencies</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.config.categories.map(cat => (
                    <Badge key={cat} variant="info" size="sm">{cat}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Exclude Patterns</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.config.excludePatterns.length > 0 ? selectedPackage.config.excludePatterns.map(p => (
                    <span key={p} className="px-2 py-1 bg-bg-tertiary text-fg-muted text-xs rounded font-mono">{p}</span>
                  )) : (
                    <span className="text-xs text-fg-muted">None</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Custom Rules</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.config.customRules.length > 0 ? selectedPackage.config.customRules.map(r => (
                    <Badge key={r} variant="warning" size="sm">{r}</Badge>
                  )) : (
                    <span className="text-xs text-fg-muted">None</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MonorepoSupport;

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

interface IDEExtension {
  id: string;
  name: string;
  platform: 'VS Code' | 'JetBrains' | 'Vim' | 'Sublime';
  version: string;
  installed: boolean;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync: string;
  diagnosticsCount: number;
}

interface DiagnosticItem {
  id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column: number;
  source: string;
  quickFixAvailable: boolean;
}

interface LSPConfig {
  enabled: boolean;
  port: number;
  autoFix: boolean;
  realTimeAnalysis: boolean;
  showInlineHints: boolean;
  diagnosticDelay: number;
}

const ideExtensions: IDEExtension[] = [
  { id: 'ext1', name: 'CodePulse for VS Code', platform: 'VS Code', version: '3.2.1', installed: true, status: 'connected', lastSync: '2 minutes ago', diagnosticsCount: 8 },
  { id: 'ext2', name: 'CodePulse for JetBrains', platform: 'JetBrains', version: '2.8.0', installed: true, status: 'connected', lastSync: '5 minutes ago', diagnosticsCount: 12 },
  { id: 'ext3', name: 'CodePulse for Vim', platform: 'Vim', version: '1.4.2', installed: false, status: 'disconnected', lastSync: 'Never', diagnosticsCount: 0 },
  { id: 'ext4', name: 'CodePulse for Sublime', platform: 'Sublime', version: '1.2.0', installed: false, status: 'disconnected', lastSync: 'Never', diagnosticsCount: 0 },
];

const mockDiagnostics: DiagnosticItem[] = [
  { id: 'd1', severity: 'error', message: 'Type \'string | null\' is not assignable to type \'string\'', file: 'src/auth/service.ts', line: 45, column: 12, source: 'TypeScript', quickFixAvailable: true },
  { id: 'd2', severity: 'warning', message: 'Variable \'user\' is declared but never used', file: 'src/api/users.ts', line: 78, column: 7, source: 'ESLint', quickFixAvailable: true },
  { id: 'd3', severity: 'error', message: 'SQL injection vulnerability detected', file: 'src/api/search.ts', line: 112, column: 25, source: 'CodePulse Security', quickFixAvailable: true },
  { id: 'd4', severity: 'info', message: 'Consider using async/await instead of .then()', file: 'src/handlers/response.ts', line: 33, column: 5, source: 'CodePulse Style', quickFixAvailable: false },
  { id: 'd5', severity: 'warning', message: 'Function has too many parameters (6/4)', file: 'src/utils/helpers.ts', line: 15, column: 1, source: 'CodePulse Complexity', quickFixAvailable: false },
  { id: 'd6', severity: 'error', message: 'Null pointer dereference possible', file: 'src/auth/service.ts', line: 52, column: 18, source: 'CodePulse Analysis', quickFixAvailable: true },
];

const severityConfig = {
  error: { color: 'text-red', bg: 'bg-red/10', icon: '●' },
  warning: { color: 'text-yellow', bg: 'bg-yellow/10', icon: '▲' },
  info: { color: 'text-blue', bg: 'bg-blue/10', icon: '◆' },
};

export function LSPIntegration() {
  const [extensions, setExtensions] = React.useState<IDEExtension[]>(ideExtensions);
  const [activeIDE, setActiveIDE] = React.useState('VS Code');
  const [config, setConfig] = React.useState<LSPConfig>({
    enabled: true,
    port: 9321,
    autoFix: true,
    realTimeAnalysis: true,
    showInlineHints: true,
    diagnosticDelay: 300,
  });
  const [selectedDiagnostic, setSelectedDiagnostic] = React.useState<DiagnosticItem | null>(null);

  const toggleExtension = (id: string) => {
    setExtensions(extensions.map(ext =>
      ext.id === id ? { ...ext, installed: !ext.installed, status: !ext.installed ? 'connected' : 'disconnected' } : ext
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">IDE Integration</h2>
          <p className="text-sm text-fg-muted mt-1">LSP integration for real-time IDE diagnostics</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.enabled}
            onChange={() => setConfig({ ...config, enabled: !config.enabled })}
            label="LSP Server"
          />
          <Badge variant="success" dot>Running on :{config.port}</Badge>
        </div>
      </div>

      {/* IDE Extensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {extensions.map(ext => (
          <Card key={ext.id} className={cn(ext.status === 'connected' && 'border-l-4 border-l-green')}>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg-tertiary rounded-lg flex items-center justify-center text-lg">
                    {ext.platform === 'VS Code' ? '💜' : ext.platform === 'JetBrains' ? '🧠' : ext.platform === 'Vim' ? '📝' : '📋'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-fg">{ext.name}</div>
                    <div className="text-xs text-fg-muted">v{ext.version} • {ext.lastSync}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={ext.status === 'connected' ? 'success' : 'outline'}
                    size="sm"
                    dot={ext.status === 'connected'}
                  >
                    {ext.status}
                  </Badge>
                </div>
              </div>
              {ext.installed && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-fg-muted">{ext.diagnosticsCount} active diagnostics</span>
                  <Button size="xs" variant="ghost" onClick={() => toggleExtension(ext.id)}>
                    {ext.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
              )}
              {!ext.installed && (
                <div className="mt-3">
                  <Button size="xs" fullWidth onClick={() => toggleExtension(ext.id)}>Install Extension</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* LSP Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>LSP Server Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <Switch
                checked={config.autoFix}
                onChange={() => setConfig({ ...config, autoFix: !config.autoFix })}
                label="Auto-Fix on Save"
                description="Automatically apply safe fixes when file is saved"
              />
              <Switch
                checked={config.realTimeAnalysis}
                onChange={() => setConfig({ ...config, realTimeAnalysis: !config.realTimeAnalysis })}
                label="Real-Time Analysis"
                description="Analyze code as you type (may impact performance)"
              />
              <Switch
                checked={config.showInlineHints}
                onChange={() => setConfig({ ...config, showInlineHints: !config.showInlineHints })}
                label="Inline Hints"
                description="Show CodePulse hints inline with code"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Server Port</label>
                <input
                  type="number"
                  value={config.port}
                  onChange={e => setConfig({ ...config, port: parseInt(e.target.value) })}
                  className="w-full rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Diagnostic Delay (ms)</label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={config.diagnosticDelay}
                  onChange={e => setConfig({ ...config, diagnosticDelay: parseInt(e.target.value) })}
                  className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-xs text-fg-muted mt-1">
                  <span>0ms</span>
                  <span>{config.diagnosticDelay}ms</span>
                  <span>2000ms</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Diagnostics */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Live Diagnostics</CardTitle>
          <div className="flex items-center gap-2">
            <Select
              options={[
                { value: 'all', label: 'All IDEs' },
                { value: 'VS Code', label: 'VS Code' },
                { value: 'JetBrains', label: 'JetBrains' },
              ]}
              value={activeIDE}
              onChange={e => setActiveIDE(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockDiagnostics.map(diagnostic => (
              <div
                key={diagnostic.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors',
                  severityConfig[diagnostic.severity].bg,
                  'hover:ring-1 hover:ring-accent/50',
                  selectedDiagnostic?.id === diagnostic.id && 'ring-1 ring-accent'
                )}
                onClick={() => setSelectedDiagnostic(diagnostic)}
              >
                <span className={cn('text-sm', severityConfig[diagnostic.severity].color)}>
                  {severityConfig[diagnostic.severity].icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-fg truncate">{diagnostic.message}</div>
                  <div className="text-[10px] text-fg-muted font-mono">
                    {diagnostic.file}:{diagnostic.line}:{diagnostic.column} • {diagnostic.source}
                  </div>
                </div>
                {diagnostic.quickFixAvailable && (
                  <Badge variant="success" size="sm">Quick Fix</Badge>
                )}
                <span className={cn('text-[10px] font-medium uppercase', severityConfig[diagnostic.severity].color)}>
                  {diagnostic.severity}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Detail */}
      {selectedDiagnostic && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Diagnostic Detail</CardTitle>
            <button onClick={() => setSelectedDiagnostic(null)} className="text-fg-muted hover:text-fg">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-10 10M5 5l10 10" /></svg>
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm', severityConfig[selectedDiagnostic.severity].color)}>
                  {severityConfig[selectedDiagnostic.severity].icon}
                </span>
                <span className="text-sm font-medium text-fg">{selectedDiagnostic.message}</span>
              </div>
              <div className="bg-bg-tertiary rounded-lg p-3 font-mono text-xs text-fg-muted">
                <div>{selectedDiagnostic.file}</div>
                <div>Line {selectedDiagnostic.line}, Column {selectedDiagnostic.column}</div>
                <div className="mt-1 text-fg">Source: {selectedDiagnostic.source}</div>
              </div>
              {selectedDiagnostic.quickFixAvailable && (
                <div className="flex gap-2">
                  <Button size="sm">Apply Quick Fix</Button>
                  <Button size="sm" variant="outline">View Suggestion</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LSPIntegration;

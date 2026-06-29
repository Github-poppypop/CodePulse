import * as React from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Input, Select, Switch, Modal } from '../ui';

// ─── Types ────────────────────────────────────────────────────────────────----

type ConnectionMode = 'online' | 'offline' | 'airgapped';
type LLMBackend = 'llama-cpp' | 'ollama' | 'local-anthropic' | 'custom-openai';
type MCPTransport = 'stdio' | 'sse' | 'http' | 'pipe';

interface LocalModel {
  id: string;
  name: string;
  backend: LLMBackend;
  path: string;
  contextSize: number;
  status: 'loaded' | 'available' | 'error' | 'downloading';
  sizeGB: number;
  quantization?: string;
}

interface MCPServer {
  id: string;
  name: string;
  transport: MCPTransport;
  endpoint: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error';
  tools: number;
}

interface OfflineRun {
  id: string;
  repo: string;
  model: string;
  timestamp: string;
  findings: number;
  synced: boolean;
}

interface SyncQueueItem {
  id: string;
  type: 'run' | 'config' | 'finding';
  repo: string;
  timestamp: string;
  size: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const localModels: LocalModel[] = [
  { id: 'lm-1', name: 'CodeLlama 13B Q4', backend: 'llama-cpp', path: 'models/codellama-13b.Q4_K_M.gguf', contextSize: 16384, status: 'loaded', sizeGB: 7.8, quantization: 'Q4_K_M' },
  { id: 'lm-2', name: 'Llama 3 8B Q5', backend: 'ollama', path: 'ollama:llama3:8b', contextSize: 8192, status: 'available', sizeGB: 4.7, quantization: 'Q5_K_M' },
  { id: 'lm-3', name: 'DeepSeek Coder V2', backend: 'llama-cpp', path: 'models/deepseek-coder-v2.Q3_K_M.gguf', contextSize: 32768, status: 'available', sizeGB: 14.2, quantization: 'Q3_K_M' },
  { id: 'lm-4', name: 'Mistral 7B Instruct', backend: 'ollama', path: 'ollama:mistral:7b', contextSize: 8192, status: 'downloading', sizeGB: 4.1, quantization: 'Q4_0' },
];

const mcpServers: MCPServer[] = [
  { id: 'mcp-1', name: 'Filesystem', transport: 'stdio', endpoint: 'npx -y @modelcontextprotocol/server-filesystem', enabled: true, status: 'connected', tools: 12 },
  { id: 'mcp-2', name: 'Git', transport: 'stdio', endpoint: 'npx -y @modelcontextprotocol/server-git', enabled: true, status: 'connected', tools: 8 },
  { id: 'mcp-3', name: 'GitHub', transport: 'http', endpoint: 'http://localhost:3001/mcp', enabled: false, status: 'disconnected', tools: 0 },
  { id: 'mcp-4', name: 'Custom Scanner', transport: 'sse', endpoint: 'http://localhost:8765/sse', enabled: true, status: 'error', tools: 0 },
];

const offlineRuns: OfflineRun[] = [
  { id: 'or-1', repo: 'api-gateway', model: 'CodeLlama 13B Q4', timestamp: '2026-06-28T08:15:00Z', findings: 4, synced: true },
  { id: 'or-2', repo: 'auth-service', model: 'Llama 3 8B Q5', timestamp: '2026-06-28T07:30:00Z', findings: 2, synced: false },
  { id: 'or-3', repo: 'frontend-app', model: 'CodeLlama 13B Q4', timestamp: '2026-06-27T22:00:00Z', findings: 1, synced: true },
];

const syncQueue: SyncQueueItem[] = [
  { id: 'sq-1', type: 'run', repo: 'auth-service', timestamp: '2026-06-28T07:30:00Z', size: '2.4 KB', status: 'pending' },
  { id: 'sq-2', type: 'finding', repo: 'api-gateway', timestamp: '2026-06-28T08:15:00Z', size: '890 B', status: 'synced' },
  { id: 'sq-3', type: 'config', repo: 'codepulse', timestamp: '2026-06-28T00:00:00Z', size: '1.1 KB', status: 'synced' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (ts: string): string => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const statusBadge = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const map: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    loaded: 'success', connected: 'success', synced: 'success',
    available: 'info', pending: 'info', syncing: 'info',
    error: 'error', failed: 'error', disconnected: 'error',
    downloading: 'warning', airgapped: 'warning',
  };
  return map[status] || 'default';
};
const backendIcon = (backend: LLMBackend): string => {
  const map: Record<LLMBackend, string> = { 'llama-cpp': 'L', 'ollama': 'O', 'local-anthropic': 'A', 'custom-openai': 'C' };
  return map[backend];
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ModelCard({ model, onToggle, onRemove }: {
  model: LocalModel;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card variant="outlined" padding="sm" className="hover:border-accent/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
            {backendIcon(model.backend)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-fg truncate">{model.name}</span>
              <Badge variant={statusBadge(model.status)} size="sm">{model.status}</Badge>
              {model.quantization && <Badge variant="outline" size="sm">{model.quantization}</Badge>}
            </div>
            <div className="text-[10px] text-fg-subtle mt-0.5">{model.path}</div>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-fg-muted">
              <span>{model.sizeGB} GB</span>
              <span>{model.contextSize.toLocaleString()} ctx</span>
              <span>{model.backend}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="xs" variant="ghost" onClick={() => onToggle(model.id)}>Load</Button>
          <Button size="xs" variant="ghost" onClick={() => onRemove(model.id)}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-10 10M5 5l10 10" /></svg>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MCPCard({ server, onToggle }: {
  server: MCPServer;
  onToggle: (id: string) => void;
}) {
  return (
    <Card variant="outlined" padding="sm" className="hover:border-accent/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center flex-shrink-0">
            <Badge variant={statusBadge(server.status)} dot size="sm" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-fg">{server.name}</span>
              <Badge variant="default" size="sm">{server.transport}</Badge>
              {server.tools > 0 && <Badge variant="info" size="sm">{server.tools} tools</Badge>}
            </div>
            <p className="text-[10px] text-fg-subtle truncate mt-0.5">{server.endpoint}</p>
          </div>
        </div>
        <Switch checked={server.enabled} onChange={() => onToggle(server.id)} size="sm" />
      </div>
    </Card>
  );
}

function SyncQueueCard({ item }: { item: SyncQueueItem }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant={item.type === 'run' ? 'info' : item.type === 'finding' ? 'warning' : 'default'} size="sm">{item.type}</Badge>
        <span className="text-sm text-fg truncate">{item.repo}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-fg-subtle">{item.size}</span>
        <Badge variant={statusBadge(item.status)} size="sm">{item.status}</Badge>
      </div>
    </div>
  );
}

// ─── Add Model Modal ──────────────────────────────────────────────────────────

function AddModelModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (model: Omit<LocalModel, 'id' | 'status'>) => void;
}) {
  const [name, setName] = React.useState('');
  const [backend, setBackend] = React.useState<LLMBackend>('llama-cpp');
  const [path, setPath] = React.useState('');

  const handleSubmit = () => {
    if (!name || !path) return;
    onAdd({ name, backend, path, contextSize: 8192, sizeGB: 0 });
    setName(''); setPath(''); setBackend('llama-cpp');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Local Model" description="Configure a local LLM for offline analysis" size="md">
      <div className="space-y-4">
        <Input label="Model Name" placeholder="e.g. CodeLlama 13B Q4" value={name} onChange={(e) => setName(e.target.value)} />
        <Select
          label="Backend"
          options={[
            { value: 'llama-cpp', label: 'llama.cpp' },
            { value: 'ollama', label: 'Ollama' },
            { value: 'local-anthropic', label: 'Local Anthropic Proxy' },
            { value: 'custom-openai', label: 'Custom OpenAI-compatible' },
          ]}
          value={backend}
          onChange={(e) => setBackend(e.target.value as LLMBackend)}
          placeholder="Select backend"
        />
        <Input label="Model Path" placeholder="models/model.gguf or ollama:model:tag" value={path} onChange={(e) => setPath(e.target.value)} hint="File path for llama.cpp, model spec for Ollama" />
        <CardFooter className="mt-6 px-0 pb-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || !path}>Add Model</Button>
        </CardFooter>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OfflineMode() {
  const [mode, setMode] = React.useState<ConnectionMode>('offline');
  const [targetMode, setTargetMode] = React.useState<ConnectionMode>('offline');
  const [models, setModels] = React.useState<LocalModel[]>(localModels);
  const [mcpServersState, updateMcpServers] = React.useState<MCPServer[]>(mcpServers);
  const [activeTab, setActiveTab] = React.useState<'models' | 'mcp' | 'runs' | 'sync'>('models');
  const [showAddModel, setShowAddModel] = React.useState(false);
  const [autoSync, setAutoSync] = React.useState(true);

  const toggleModel = (id: string) => {
    setModels((prev) => prev.map((m) => m.id === id ? { ...m, status: m.status === 'loaded' ? 'available' as const : 'loaded' as const } : m));
  };

  const removeModel = (id: string) => setModels((prev) => prev.filter((m) => m.id !== id));

  const toggleMCP = (id: string) => {
    updateMcpServers((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const addModel = (model: Omit<LocalModel, 'id' | 'status'>) => {
    setModels((prev) => [...prev, { ...model, id: `lm-${Date.now()}`, status: 'available' }]);
  };

  const applyMode = () => setMode(targetMode);

  const tabs = [
    { key: 'models' as const, label: 'Local Models', count: models.length },
    { key: 'mcp' as const, label: 'MCP Servers', count: mcpServersState.length },
    { key: 'runs' as const, label: 'Offline Runs', count: offlineRuns.length },
    { key: 'sync' as const, label: 'Sync Queue', count: syncQueue.filter((s) => s.status === 'pending').length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-fg">Offline Mode</h2>
          <p className="text-sm text-fg-muted mt-1">Run full analysis locally — llama.cpp, local MCP, air-gapped support</p>
        </div>
        <Badge variant={statusBadge(mode)} size="lg" dot>{mode === 'online' ? 'Online' : mode === 'offline' ? 'Offline' : 'Air-gapped'}</Badge>
      </div>

      {/* Mode Switcher */}
      <Card variant="outlined" padding="md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm font-medium text-fg">Connection Mode</div>
            <div className="text-xs text-fg-muted mt-0.5">Switch between online, offline, or air-gapped operation</div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              options={[
                { value: 'online', label: 'Online (Cloud LLMs)' },
                { value: 'offline', label: 'Offline (Local LLMs)' },
                { value: 'airgapped', label: 'Air-gapped (No Network)' },
              ]}
              value={targetMode}
              onChange={(e) => setTargetMode(e.target.value as ConnectionMode)}
            />
            <Button size="sm" onClick={applyMode} disabled={targetMode === mode}>Apply</Button>
          </div>
        </div>
        {mode === 'airgapped' && (
          <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-xs text-warning font-medium">Air-gapped mode active</p>
            <p className="text-[10px] text-fg-muted mt-0.5">All analysis runs on local models only. No data leaves this machine. MCP servers use stdio transport.</p>
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-fg">{models.filter((m) => m.status === 'loaded').length}</div>
          <div className="text-xs text-fg-muted">Models Loaded</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-fg">{mcpServersState.filter((s) => s.status === 'connected').length}</div>
          <div className="text-xs text-fg-muted">MCP Connected</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-success">{offlineRuns.length}</div>
          <div className="text-xs text-fg-muted">Offline Runs</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className={`text-2xl font-bold ${syncQueue.filter((s) => s.status === 'pending').length > 0 ? 'text-warning' : 'text-success'}`}>
            {syncQueue.filter((s) => s.status === 'pending').length}
          </div>
          <div className="text-xs text-fg-muted">Pending Sync</div>
        </Card>
      </div>

      {/* Auto-sync Toggle */}
      <div className="flex items-center gap-3">
        <Switch checked={autoSync} onChange={() => setAutoSync(!autoSync)} label="Auto-sync when reconnected" description="Automatically upload queued data when connectivity is restored" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab.key ? 'text-accent' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {tab.label}
            <Badge variant={activeTab === tab.key ? 'info' : 'default'} size="sm" className="ml-2">{tab.count}</Badge>
            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'models' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddModel(true)} leftIcon={<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 5v10M5 10h10" /></svg>}>
              Add Model
            </Button>
          </div>
          {models.map((model) => (
            <ModelCard key={model.id} model={model} onToggle={toggleModel} onRemove={removeModel} />
          ))}
        </div>
      )}

      {activeTab === 'mcp' && (
        <div className="space-y-3">
          <Card variant="outlined" padding="sm" className="bg-bg-secondary/50">
            <div className="text-xs text-fg-muted">MCP servers provide tools for local analysis. In air-gapped mode, only stdio transport is available.</div>
          </Card>
          {mcpServersState.map((server) => (
            <MCPCard key={server.id} server={server} onToggle={toggleMCP} />
          ))}
        </div>
      )}

      {activeTab === 'runs' && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Offline Runs</CardTitle>
            <CardDescription>Analysis runs executed with local models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offlineRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm text-fg truncate">{run.repo}</div>
                      <div className="text-[10px] text-fg-subtle">{run.model} &middot; {formatTime(run.timestamp)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info" size="sm">{run.findings} findings</Badge>
                    <Badge variant={run.synced ? 'success' : 'warning'} size="sm">{run.synced ? 'Synced' : 'Local'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'sync' && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Sync Queue</CardTitle>
            <CardDescription>Data waiting to be synced when connectivity is available</CardDescription>
          </CardHeader>
          <CardContent>
            {syncQueue.length === 0 ? (
              <div className="text-center py-8 text-fg-muted text-sm">All data synced</div>
            ) : (
              syncQueue.map((item) => <SyncQueueCard key={item.id} item={item} />)
            )}
          </CardContent>
          {syncQueue.some((s) => s.status === 'pending') && (
            <CardFooter>
              <Button size="sm" variant="outline">Retry Failed Syncs</Button>
              <Button size="sm">Sync Now</Button>
            </CardFooter>
          )}
        </Card>
      )}

      <AddModelModal open={showAddModel} onClose={() => setShowAddModel(false)} onAdd={addModel} />
    </div>
  );
}

export default OfflineMode;

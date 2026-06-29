import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input, Label, Textarea } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { Switch } from '../ui/Switch';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SensorLanguage = 'typescript' | 'python' | 'rust' | 'go' | 'wasm';

export type SensorStatus = 'active' | 'inactive' | 'error' | 'building';

export interface SensorCapability {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'security' | 'performance' | 'style' | 'custom';
}

export interface CustomSensor {
  id: string;
  name: string;
  description: string;
  language: SensorLanguage;
  version: string;
  status: SensorStatus;
  capabilities: SensorCapability[];
  author: string;
  repositoryUrl?: string;
  wasmModule?: string;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  findingsCount: number;
}

export interface CustomSensorSDKProps {
  sensors: CustomSensor[];
  onCreateSensor: (data: SensorCreateData) => Promise<void>;
  onUpdateSensor: (sensorId: string, data: Partial<SensorCreateData>) => Promise<void>;
  onDeleteSensor: (sensorId: string) => Promise<void>;
  onToggleStatus: (sensorId: string, active: boolean) => Promise<void>;
  onTestSensor?: (sensorId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export interface SensorCreateData {
  name: string;
  description: string;
  language: SensorLanguage;
  code: string;
  capabilities: string[];
  config: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const languageConfig: Record<SensorLanguage, { label: string; color: 'info' | 'success' | 'warning' | 'error' | 'default'; icon: string }> = {
  typescript: { label: 'TypeScript', color: 'info', icon: 'TS' },
  python: { label: 'Python', color: 'warning', icon: 'PY' },
  rust: { label: 'Rust', color: 'error', icon: 'RS' },
  go: { label: 'Go', color: 'info', icon: 'GO' },
  wasm: { label: 'WASM', color: 'success', icon: 'WASM' },
};

const statusConfig: Record<SensorStatus, { label: string; variant: 'success' | 'default' | 'error' | 'warning' }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'default' },
  error: { label: 'Error', variant: 'error' },
  building: { label: 'Building', variant: 'warning' },
};

const availableCapabilities: SensorCapability[] = [
  { id: 'static-analysis', name: 'Static Analysis', description: 'Analyze code without execution', category: 'analysis' },
  { id: 'security-scan', name: 'Security Scanning', description: 'Detect security vulnerabilities', category: 'security' },
  { id: 'perf-profiling', name: 'Performance Profiling', description: 'Identify performance bottlenecks', category: 'performance' },
  { id: 'style-lint', name: 'Style Linting', description: 'Enforce code style guidelines', category: 'style' },
  { id: 'dep-audit', name: 'Dependency Audit', description: 'Check for vulnerable dependencies', category: 'security' },
  { id: 'type-check', name: 'Type Checking', description: 'Verify type safety', category: 'analysis' },
  { id: 'complexity', name: 'Complexity Analysis', description: 'Measure code complexity', category: 'analysis' },
  { id: 'custom-rule', name: 'Custom Rules', description: 'User-defined analysis rules', category: 'custom' },
];

const defaultTypeScriptCode = `import { Sensor, Finding, Context } from '@codepulse/sdk';

export default class MySensor extends Sensor {
  id = 'my-custom-sensor';
  name = 'My Custom Sensor';
  description = 'Analyzes code for custom patterns';

  capabilities = ['static-analysis', 'custom-rule'];

  async analyze(ctx: Context): Promise<Finding[]> {
    const findings: Finding[] = [];

    for (const file of ctx.getFiles()) {
      const ast = await ctx.parse(file);

      // Your analysis logic here
      ast.walk((node) => {
        if (this.matchesPattern(node)) {
          findings.push({
            title: 'Custom pattern detected',
            severity: 'MEDIUM',
            filePath: file.path,
            line: node.loc.start.line,
            description: 'A custom pattern was found.',
          });
        }
      });
    }

    return findings;
  }

  private matchesPattern(node: any): boolean {
    // Implement your detection logic
    return false;
  }
}
`;

const defaultWasmCode = `# Custom Sensor (WASM target)

This module compiles to WebAssembly for sandboxed execution.

## Build
\`\`\`bash
cargo build --target wasm32-wasi --release
\`\`\`

## Interface
The module exports:
- \`analyze(ptr: i32, len: i32) -> i32\` - Run analysis on input
- \`alloc(size: i32) -> i32\` - Allocate memory
- \`dealloc(ptr: i32, size: i32)\` - Free memory
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomSensorSDK({
  sensors,
  onCreateSensor,
  onUpdateSensor,
  onDeleteSensor,
  onToggleStatus,
  onTestSensor,
  loading = false,
  className,
}: CustomSensorSDKProps) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedSensor, setSelectedSensor] = React.useState<CustomSensor | null>(null);
  const [search, setSearch] = React.useState('');

  const filteredSensors = React.useMemo(() => {
    if (!search.trim()) return sensors;
    const q = search.toLowerCase();
    return sensors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [sensors, search]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-fg">Custom Sensors</h2>
          <p className="text-sm text-fg-muted mt-0.5">
            Build custom analyzers with TypeScript, Python, Rust, Go, or WASM plugins.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          leftIcon={
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          }
        >
          New Sensor
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search sensors…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        }
      />

      {/* Sensor Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredSensors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <svg
              className="w-12 h-12 text-fg-subtle mx-auto mb-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
            <h3 className="text-base font-medium text-fg mb-1">No Custom Sensors</h3>
            <p className="text-sm text-fg-muted mb-4">
              Create your first custom sensor to extend CodePulse's analysis capabilities.
            </p>
            <Button onClick={() => setCreateOpen(true)}>Create Sensor</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSensors.map((sensor) => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              onToggle={() => onToggleStatus(sensor.id, sensor.status !== 'active')}
              onSelect={() => setSelectedSensor(sensor)}
              onDelete={() => onDeleteSensor(sensor.id)}
              onTest={onTestSensor ? () => onTestSensor(sensor.id) : undefined}
            />
          ))}
        </div>
      )}

      {/* Create Sensor Modal */}
      <CreateSensorModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={onCreateSensor}
      />

      {/* Sensor Detail Modal */}
      {selectedSensor && (
        <SensorDetailModal
          sensor={selectedSensor}
          onClose={() => setSelectedSensor(null)}
          onUpdate={onUpdateSensor}
        />
      )}
    </div>
  );
}

// ─── Sensor Card ──────────────────────────────────────────────────────────────

interface SensorCardProps {
  sensor: CustomSensor;
  onToggle: () => void;
  onSelect: () => void;
  onDelete: () => void;
  onTest?: () => void;
}

function SensorCard({ sensor, onToggle, onSelect, onDelete, onTest }: SensorCardProps) {
  const lang = languageConfig[sensor.language];
  const status = statusConfig[sensor.status];

  return (
    <Card hover className="cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={lang.color} size="sm">
                {lang.icon}
              </Badge>
              <Badge variant={status.variant} size="sm" dot>
                {status.label}
              </Badge>
              <span className="text-xs text-fg-subtle">v{sensor.version}</span>
            </div>
            <CardTitle className="truncate">{sensor.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {sensor.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sensor.capabilities.slice(0, 3).map((capItem) => {
            const capId = typeof capItem === 'string' ? capItem : String(capItem.id);
            const cap = availableCapabilities.find((c) => String(c.id) === capId);
            return cap ? (
              <Badge key={capId} variant="outline" size="sm">
                {cap.name}
              </Badge>
            ) : (
              <Badge key={capId} variant="outline" size="sm">
                {capId}
              </Badge>
            );
          })}
          {sensor.capabilities.length > 3 && (
            <Badge variant="default" size="sm">
              +{sensor.capabilities.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-fg-muted">
          <span>{sensor.findingsCount} findings</span>
          {sensor.lastRunAt && (
            <span>Last run: {new Date(sensor.lastRunAt).toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Switch
          checked={sensor.status === 'active'}
          onChange={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          label=""
        />
        <div className="flex-1" />
        {onTest && (
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              onTest();
            }}
          >
            Test
          </Button>
        )}
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

// ─── Create Sensor Modal ──────────────────────────────────────────────────────

interface CreateSensorModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: SensorCreateData) => Promise<void>;
}

function CreateSensorModal({ open, onClose, onCreate }: CreateSensorModalProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [language, setLanguage] = React.useState<SensorLanguage>('typescript');
  const [code, setCode] = React.useState(defaultTypeScriptCode);
  const [selectedCapabilities, setSelectedCapabilities] = React.useState<string[]>(['static-analysis']);
  const [config, setConfig] = React.useState('{\n  \n}');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLanguageChange = (lang: SensorLanguage) => {
    setLanguage(lang);
    if (lang === 'typescript') setCode(defaultTypeScriptCode);
    else if (lang === 'wasm') setCode(defaultWasmCode);
    else setCode(`# ${lang} sensor implementation\n`);
  };

  const toggleCapability = (id: string) => {
    setSelectedCapabilities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sensor name is required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onCreate({ name, description, language, code, capabilities: selectedCapabilities, config });
      onClose();
      // Reset
      setName('');
      setDescription('');
      setLanguage('typescript');
      setCode(defaultTypeScriptCode);
      setSelectedCapabilities(['static-analysis']);
      setConfig('{\n  \n}');
    } catch {
      setError('Failed to create sensor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Custom Sensor"
      description="Build a custom analyzer using the CodePulse SDK."
      size="full"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sensor-name" required>Name</Label>
            <Input
              id="sensor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-custom-sensor"
              required
            />
          </div>
          <div>
            <Label htmlFor="sensor-lang" required>Language</Label>
            <Select
              id="sensor-lang"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SensorLanguage)}
              options={([
                { value: 'typescript', label: 'TypeScript' },
                { value: 'python', label: 'Python' },
                { value: 'rust', label: 'Rust' },
                { value: 'go', label: 'Go' },
                { value: 'wasm', label: 'WebAssembly' },
              ])}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="sensor-desc">Description</Label>
          <Input
            id="sensor-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this sensor analyze?"
          />
        </div>

        {/* Capabilities */}
        <div>
          <Label>Capabilities</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {availableCapabilities.map((cap) => (
              <button
                key={cap.id}
                type="button"
                onClick={() => toggleCapability(cap.id)}
                className={cn(
                  'p-2 rounded-lg border text-left transition-colors',
                  selectedCapabilities.includes(cap.id)
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-bg-secondary hover:border-border-hover'
                )}
              >
                <span className="text-xs font-medium text-fg block">{cap.name}</span>
                <span className="text-[10px] text-fg-subtle line-clamp-2">{cap.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor */}
        <div>
          <Label htmlFor="sensor-code" required>Implementation</Label>
          <textarea
            id="sensor-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            spellCheck={false}
            className={cn(
              'w-full rounded-lg bg-bg-tertiary border border-border text-fg font-mono text-xs',
              'transition-all duration-150 px-4 py-3 resize-y',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
              'placeholder-fg-subtle'
            )}
          />
        </div>

        {/* Config */}
        <div>
          <Label htmlFor="sensor-config">Configuration (JSON)</Label>
          <textarea
            id="sensor-config"
            value={config}
            onChange={(e) => setConfig(e.target.value)}
            rows={4}
            spellCheck={false}
            className={cn(
              'w-full rounded-lg bg-bg-tertiary border border-border text-fg font-mono text-xs',
              'transition-all duration-150 px-4 py-3 resize-y',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent'
            )}
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/30">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Sensor
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Sensor Detail Modal ──────────────────────────────────────────────────────

interface SensorDetailModalProps {
  sensor: CustomSensor;
  onClose: () => void;
  onUpdate: (sensorId: string, data: Partial<SensorCreateData>) => Promise<void>;
}

function SensorDetailModal({ sensor, onClose, onUpdate }: SensorDetailModalProps) {
  const lang = languageConfig[sensor.language];
  const status = statusConfig[sensor.status];

  return (
    <Modal
      open={!!sensor}
      onClose={onClose}
      title={sensor.name}
      description={sensor.description}
      size="full"
    >
      <div className="space-y-5">
        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={lang.color} size="md">{lang.label}</Badge>
          <Badge variant={status.variant} size="md" dot>{status.label}</Badge>
          <Badge variant="outline" size="md">v{sensor.version}</Badge>
          <span className="text-xs text-fg-muted">by {sensor.author}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-bg-secondary border border-border text-center">
            <div className="text-lg font-bold text-fg">{sensor.findingsCount}</div>
            <div className="text-xs text-fg-muted">Findings</div>
          </div>
          <div className="p-3 rounded-lg bg-bg-secondary border border-border text-center">
            <div className="text-lg font-bold text-fg">{sensor.capabilities.length}</div>
            <div className="text-xs text-fg-muted">Capabilities</div>
          </div>
          <div className="p-3 rounded-lg bg-bg-secondary border border-border text-center">
            <div className="text-lg font-bold text-fg">
              {sensor.lastRunAt ? new Date(sensor.lastRunAt).toLocaleDateString() : '—'}
            </div>
            <div className="text-xs text-fg-muted">Last Run</div>
          </div>
        </div>

        {/* Capabilities */}
        <div>
          <h4 className="text-sm font-medium text-fg mb-2">Capabilities</h4>
          <div className="flex flex-wrap gap-2">
            {sensor.capabilities.map((capItem) => {
              const capId = typeof capItem === 'string' ? capItem : String(capItem.id);
              const cap = availableCapabilities.find((c) => String(c.id) === capId);
              return cap ? (
                <Badge key={capId} variant="info" size="md">
                  {cap.name}
                </Badge>
              ) : (
                <Badge key={capId} variant="outline" size="md">
                  {capId}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Repository */}
        {sensor.repositoryUrl && (
          <div>
            <h4 className="text-sm font-medium text-fg mb-1">Repository</h4>
            <a
              href={sensor.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover"
            >
              {sensor.repositoryUrl}
            </a>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CustomSensorSDK;

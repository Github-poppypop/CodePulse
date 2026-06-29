import * as React from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Input, Switch, Modal } from '../ui';

// ─── Types ────────────────────────────────────────────────────────────────----

type FindingCategory = 'security' | 'performance' | 'maintainability' | 'style';
type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';
type DuplicateStatus = 'duplicate' | 'unique' | 'merged' | 'false-positive';

interface FindingFingerprint {
  id: string;
  hash: string;
  category: FindingCategory;
  severity: FindingSeverity;
  file: string;
  line: number;
  snippet: string;
  description: string;
  firstSeen: string;
  occurrences: number;
  repos: string[];
  status: DuplicateStatus;
  groupId?: string;
}

interface DuplicateGroup {
  id: string;
  fingerprint: string;
  count: number;
  category: FindingCategory;
  severity: FindingSeverity;
  files: string[];
  repos: string[];
  firstSeen: string;
  lastSeen: string;
  merged: boolean;
}

interface MLModel {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  active: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const dedupStats = {
  totalFindings: 248,
  uniqueFindings: 142,
  duplicateFindings: 78,
  falsePositives: 8,
  mergedGroups: 20,
  dedupRate: 31.5,
  fingerprintCoverage: 94.2,
} as const;

const duplicateGroups: DuplicateGroup[] = [
  { id: 'grp-1', fingerprint: 'sha256:a3f2...', count: 12, category: 'security', severity: 'high', files: ['src/routes/users.ts', 'src/routes/orders.ts', 'src/routes/products.ts'], repos: ['api-gateway', 'auth-service'], firstSeen: '2026-06-15T10:00:00Z', lastSeen: '2026-06-28T09:30:00Z', merged: true },
  { id: 'grp-2', fingerprint: 'sha256:b7e1...', count: 8, category: 'security', severity: 'medium', files: ['src/components/Search.tsx', 'src/components/Filter.tsx'], repos: ['frontend-app'], firstSeen: '2026-06-20T14:00:00Z', lastSeen: '2026-06-27T22:00:00Z', merged: false },
  { id: 'grp-3', fingerprint: 'sha256:c9d4...', count: 6, category: 'performance', severity: 'medium', files: ['src/db/queries.ts', 'src/services/data.ts'], repos: ['data-pipeline', 'api-gateway'], firstSeen: '2026-06-18T08:00:00Z', lastSeen: '2026-06-26T16:00:00Z', merged: true },
  { id: 'grp-4', fingerprint: 'sha256:d2a8...', count: 5, category: 'maintainability', severity: 'low', files: ['src/utils/helpers.ts', 'src/utils/format.ts', 'src/utils/parse.ts'], repos: ['frontend-app', 'docs-site'], firstSeen: '2026-06-22T11:00:00Z', lastSeen: '2026-06-25T09:00:00Z', merged: false },
  { id: 'grp-5', fingerprint: 'sha256:e5f3...', count: 4, category: 'security', severity: 'critical', files: ['src/auth/jwt.ts', 'src/auth/oauth.ts'], repos: ['auth-service'], firstSeen: '2026-06-10T06:00:00Z', lastSeen: '2026-06-28T08:00:00Z', merged: true },
];

const findingFingerprints: FindingFingerprint[] = [
  { id: 'fp-1', hash: 'sha256:a3f2e9b1...', category: 'security', severity: 'high', file: 'src/routes/users.ts', line: 42, snippet: 'SELECT * FROM users WHERE id = ?', description: 'Potential SQL injection vector', firstSeen: '2026-06-15T10:00:00Z', occurrences: 12, repos: ['api-gateway', 'auth-service'], status: 'merged', groupId: 'grp-1' },
  { id: 'fp-2', hash: 'sha256:b7e1c4d8...', category: 'security', severity: 'medium', file: 'src/components/Search.tsx', line: 18, snippet: 'dangerouslySetInnerHTML={{ __html: input }}', description: 'XSS via innerHTML', firstSeen: '2026-06-20T14:00:00Z', occurrences: 8, repos: ['frontend-app'], status: 'duplicate', groupId: 'grp-2' },
  { id: 'fp-3', hash: 'sha256:c9d4f2a1...', category: 'performance', severity: 'medium', file: 'src/db/queries.ts', line: 67, snippet: 'for (const item of items) { await db.query(...) }', description: 'N+1 query pattern', firstSeen: '2026-06-18T08:00:00Z', occurrences: 6, repos: ['data-pipeline', 'api-gateway'], status: 'merged', groupId: 'grp-3' },
  { id: 'fp-4', hash: 'sha256:f1a2b3c4...', category: 'maintainability', severity: 'low', file: 'src/utils/helpers.ts', line: 5, snippet: 'function processData(data: any) { ... }', description: 'Use of any type', firstSeen: '2026-06-25T09:00:00Z', occurrences: 1, repos: ['frontend-app'], status: 'unique' },
  { id: 'fp-5', hash: 'sha256:e5f3a1b2...', category: 'security', severity: 'critical', file: 'src/auth/jwt.ts', line: 23, snippet: "jwt.sign(payload, secret, { algorithm: 'HS256' })", description: 'Weak JWT signing algorithm', firstSeen: '2026-06-10T06:00:00Z', occurrences: 4, repos: ['auth-service'], status: 'merged', groupId: 'grp-5' },
];

const mlModels: MLModel[] = [
  { id: 'ml-1', name: 'Semantic Dedup v2', version: '2.3.1', accuracy: 94.2, precision: 91.8, recall: 96.5, active: true },
  { id: 'ml-2', name: 'AST Fingerprint', version: '1.8.0', accuracy: 89.7, precision: 95.2, recall: 84.3, active: true },
  { id: 'ml-3', name: 'Token Similarity', version: '1.2.4', accuracy: 82.1, precision: 78.9, recall: 85.6, active: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (ts: string): string => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const severityColor = (severity: FindingSeverity): 'error' | 'warning' | 'info' | 'success' | 'default' => {
  const map: Record<FindingSeverity, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
    critical: 'error', high: 'warning', medium: 'info', low: 'success',
  };
  return map[severity];
};

const categoryColor = (category: FindingCategory): 'error' | 'warning' | 'info' | 'success' | 'default' => {
  const map: Record<FindingCategory, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
    security: 'error', performance: 'warning', maintainability: 'info', style: 'default',
  };
  return map[category];
};

const statusColor = (status: DuplicateStatus): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const map: Record<DuplicateStatus, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    merged: 'success', unique: 'info', duplicate: 'warning', 'false-positive': 'error',
  };
  return map[status];
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <Card variant="outlined" padding="sm">
      <div className="text-xs text-fg-muted mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent || 'text-fg'}`}>{value}</div>
      {sub && <div className="text-[10px] text-fg-subtle mt-1">{sub}</div>}
    </Card>
  );
}

function DuplicateGroupCard({ group, onMerge, onMarkFalsePositive }: {
  group: DuplicateGroup;
  onMerge: (id: string) => void;
  onMarkFalsePositive: (id: string) => void;
}) {
  return (
    <Card variant="outlined" padding="sm" className="hover:border-accent/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <code className="text-[10px] text-accent font-mono">{group.fingerprint.slice(0, 16)}...</code>
            <Badge variant={severityColor(group.severity)} size="sm">{group.severity}</Badge>
            <Badge variant={categoryColor(group.category)} size="sm">{group.category}</Badge>
            {group.merged ? <Badge variant="success" size="sm">Merged</Badge> : <Badge variant="warning" size="sm">Pending</Badge>}
          </div>
          <div className="text-xs text-fg-muted mb-1">{group.count} occurrences across {group.repos.length} repos</div>
          <div className="flex flex-wrap gap-1 mb-1">
            {group.files.map((f) => (
              <Badge key={f} variant="outline" size="sm">{f}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-fg-subtle">
            <span>First: {formatTime(group.firstSeen)}</span>
            <span>Last: {formatTime(group.lastSeen)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!group.merged && (
            <Button size="xs" variant="primary" onClick={() => onMerge(group.id)}>Merge</Button>
          )}
          <Button size="xs" variant="ghost" onClick={() => onMarkFalsePositive(group.id)}>FP</Button>
        </div>
      </div>
    </Card>
  );
}

function FingerprintRow({ finding }: { finding: FindingFingerprint }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <code className="text-[10px] text-accent font-mono flex-shrink-0">{finding.hash.slice(0, 12)}...</code>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={severityColor(finding.severity)} size="sm">{finding.severity}</Badge>
            <Badge variant={categoryColor(finding.category)} size="sm">{finding.category}</Badge>
            <Badge variant={statusColor(finding.status)} size="sm">{finding.status}</Badge>
          </div>
          <div className="text-[10px] text-fg-subtle truncate mt-0.5">{finding.file}:{finding.line} &middot; {finding.description}</div>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-xs font-medium text-fg">{finding.occurrences}x</div>
        <div className="text-[10px] text-fg-subtle">{finding.repos.join(', ')}</div>
      </div>
    </div>
  );
}

function MLModelCard({ model, onToggle }: { model: MLModel; onToggle: (id: string) => void }) {
  return (
    <Card variant="outlined" padding="sm" className={model.active ? 'border-accent/30' : ''}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-fg">{model.name}</span>
          <Badge variant="outline" size="sm">v{model.version}</Badge>
        </div>
        <Switch checked={model.active} onChange={() => onToggle(model.id)} size="sm" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-bg-tertiary rounded">
          <div className="text-sm font-bold text-fg">{model.accuracy}%</div>
          <div className="text-[10px] text-fg-muted">Accuracy</div>
        </div>
        <div className="text-center p-2 bg-bg-tertiary rounded">
          <div className="text-sm font-bold text-fg">{model.precision}%</div>
          <div className="text-[10px] text-fg-muted">Precision</div>
        </div>
        <div className="text-center p-2 bg-bg-tertiary rounded">
          <div className="text-sm font-bold text-fg">{model.recall}%</div>
          <div className="text-[10px] text-fg-muted">Recall</div>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FindingDeduplication() {
  const [groups, setGroups] = React.useState<DuplicateGroup[]>(duplicateGroups);
  const [models, setModels] = React.useState<MLModel[]>(mlModels);
  const [activeTab, setActiveTab] = React.useState<'groups' | 'fingerprints' | 'models' | 'stats'>('groups');
  const [autoMerge, setAutoMerge] = React.useState(false);
  const [similarityThreshold, setSimilarityThreshold] = React.useState('85');

  const mergeGroup = (id: string) => {
    setGroups((prev) => prev.map((g) => g.id === id ? { ...g, merged: true } : g));
  };

  const markFalsePositive = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const toggleModel = (id: string) => {
    setModels((prev) => prev.map((m) => m.id === id ? { ...m, active: !m.active } : m));
  };

  const tabs = [
    { key: 'groups' as const, label: 'Duplicate Groups', count: groups.filter((g) => !g.merged).length },
    { key: 'fingerprints' as const, label: 'Fingerprints', count: findingFingerprints.length },
    { key: 'models' as const, label: 'ML Models', count: models.filter((m) => m.active).length },
    { key: 'stats' as const, label: 'Statistics' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-fg">Finding Deduplication</h2>
          <p className="text-sm text-fg-muted mt-1">ML-based duplicate detection across runs and repos with semantic fingerprinting</p>
        </div>
        <Button size="sm" leftIcon={<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h12M4 8h12M4 12h8" /></svg>}>
          Run Dedup Scan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Findings" value={dedupStats.totalFindings.toString()} accent="text-fg" />
        <StatCard label="Unique" value={dedupStats.uniqueFindings.toString()} sub={`${dedupStats.dedupRate.toFixed(1)}% dedup rate`} accent="text-success" />
        <StatCard label="Duplicates" value={dedupStats.duplicateFindings.toString()} sub={`${dedupStats.mergedGroups} merged`} accent="text-warning" />
        <StatCard label="Coverage" value={`${dedupStats.fingerprintCoverage}%`} sub="Fingerprint coverage" accent="text-accent" />
      </div>

      {/* Settings */}
      <Card variant="outlined" padding="sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Switch checked={autoMerge} onChange={() => setAutoMerge(!autoMerge)} label="Auto-merge" description="Automatically merge high-confidence duplicates" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-fg-muted">Similarity Threshold:</label>
            <Input
              type="number"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(e.target.value)}
              className="w-20"
              min="50"
              max="100"
            />
            <span className="text-xs text-fg-muted">%</span>
          </div>
        </div>
      </Card>

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
            {tab.count !== undefined && (
              <Badge variant={activeTab === tab.key ? 'info' : 'default'} size="sm" className="ml-2">{tab.count}</Badge>
            )}
            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'groups' && (
        <div className="space-y-3">
          {groups.filter((g) => !g.merged).length > 0 && (
            <Card variant="outlined" padding="sm" className="bg-warning/5 border-warning/20">
              <div className="text-xs text-warning font-medium">{groups.filter((g) => !g.merged).length} groups pending merge</div>
              <div className="text-[10px] text-fg-muted mt-0.5">Review and merge duplicate findings to reduce noise</div>
            </Card>
          )}
          {groups.map((group) => (
            <DuplicateGroupCard key={group.id} group={group} onMerge={mergeGroup} onMarkFalsePositive={markFalsePositive} />
          ))}
        </div>
      )}

      {activeTab === 'fingerprints' && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Finding Fingerprints</CardTitle>
            <CardDescription>Semantic hashes identifying unique code patterns</CardDescription>
          </CardHeader>
          <CardContent>
            {findingFingerprints.map((fp) => <FingerprintRow key={fp.id} finding={fp} />)}
          </CardContent>
        </Card>
      )}

      {activeTab === 'models' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <MLModelCard key={model.id} model={model} onToggle={toggleModel} />
          ))}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4">
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Deduplication Performance</CardTitle>
              <CardDescription>How effectively duplicates are being detected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Total Findings Processed', value: dedupStats.totalFindings, max: dedupStats.totalFindings },
                  { label: 'Unique Findings', value: dedupStats.uniqueFindings, max: dedupStats.totalFindings },
                  { label: 'Duplicates Detected', value: dedupStats.duplicateFindings, max: dedupStats.totalFindings },
                  { label: 'False Positives', value: dedupStats.falsePositives, max: dedupStats.totalFindings },
                  { label: 'Merged Groups', value: dedupStats.mergedGroups, max: dedupStats.totalFindings },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-fg-muted">{item.label}</span>
                      <span className="text-fg font-medium">{item.value}</span>
                    </div>
                    <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(item.value / item.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>ML Model Performance</CardTitle>
              <CardDescription>Active deduplication models and their metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {models.filter((m) => m.active).map((model) => (
                  <div key={model.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-fg">{model.name}</span>
                      <Badge variant="outline" size="sm">v{model.version}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-fg-muted">
                      <span>Acc: <strong className="text-fg">{model.accuracy}%</strong></span>
                      <span>Prec: <strong className="text-fg">{model.precision}%</strong></span>
                      <span>Rec: <strong className="text-fg">{model.recall}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default FindingDeduplication;

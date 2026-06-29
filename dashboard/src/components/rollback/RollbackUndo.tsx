import * as React from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Input, Select, Switch, Modal } from '../ui';

// ─── Types ────────────────────────────────────────────────────────────────----

type FixStatus = 'applied' | 'rolled-back' | 'failed' | 'pending';

interface AppliedFix {
  id: string;
  repo: string;
  description: string;
  appliedAt: string;
  appliedBy: string;
  commitSha: string;
  branch: string;
  file: string;
  status: FixStatus;
  originalCode: string;
  fixedCode: string;
  findingId: string;
}

interface GitSnapshot {
  sha: string;
  message: string;
  timestamp: string;
  author: string;
  branch: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const appliedFixes: AppliedFix[] = [
  {
    id: 'fix-1', repo: 'api-gateway', description: 'Fix SQL injection in user query', appliedAt: '2026-06-28T09:30:00Z',
    appliedBy: 'codepulse-bot', commitSha: 'a1b2c3d', branch: 'main', file: 'src/routes/users.ts', status: 'applied',
    originalCode: "const query = `SELECT * FROM users WHERE id = ${req.params.id}`",
    fixedCode: "const query = 'SELECT * FROM users WHERE id = ?'; await db.query(query, [req.params.id])",
    findingId: 'find-001',
  },
  {
    id: 'fix-2', repo: 'frontend-app', description: 'Sanitize XSS in search input', appliedAt: '2026-06-28T08:15:00Z',
    appliedBy: 'codepulse-bot', commitSha: 'e4f5g6h', branch: 'main', file: 'src/components/Search.tsx', status: 'applied',
    originalCode: '<div dangerouslySetInnerHTML={{ __html: searchResult }} />',
    fixedCode: '<div>{sanitizeHtml(searchResult)}</div>',
    findingId: 'find-002',
  },
  {
    id: 'fix-3', repo: 'auth-service', description: 'Use stronger JWT algorithm', appliedAt: '2026-06-27T22:00:00Z',
    appliedBy: 'codepulse-bot', commitSha: 'i7j8k9l', branch: 'main', file: 'src/auth/jwt.ts', status: 'applied',
    originalCode: "jwt.sign(payload, secret, { algorithm: 'HS256' })",
    fixedCode: "jwt.sign(payload, secret, { algorithm: 'RS256' })",
    findingId: 'find-003',
  },
  {
    id: 'fix-4', repo: 'api-gateway', description: 'Add rate limiting middleware', appliedAt: '2026-06-27T18:45:00Z',
    appliedBy: 'codepulse-bot', commitSha: 'm0n1o2p', branch: 'main', file: 'src/middleware/rate-limit.ts', status: 'rolled-back',
    originalCode: '// No rate limiting',
    fixedCode: 'app.use(rateLimit({ windowMs: 60000, max: 100 }))',
    findingId: 'find-004',
  },
];

const gitHistory: GitSnapshot[] = [
  { sha: 'a1b2c3d', message: 'Auto-fix: SQL injection in user query', timestamp: '2026-06-28T09:30:00Z', author: 'codepulse-bot', branch: 'main' },
  { sha: 'e4f5g6h', message: 'Auto-fix: XSS in search component', timestamp: '2026-06-28T08:15:00Z', author: 'codepulse-bot', branch: 'main' },
  { sha: 'i7j8k9l', message: 'Auto-fix: JWT algorithm upgrade', timestamp: '2026-06-27T22:00:00Z', author: 'codepulse-bot', branch: 'main' },
  { sha: 'm0n1o2p', message: 'Revert: Rate limiting middleware', timestamp: '2026-06-27T18:50:00Z', author: 'codepulse-bot', branch: 'main' },
  { sha: 'q3r4s5t', message: 'feat: Add user dashboard', timestamp: '2026-06-27T14:00:00Z', author: 'dev-team', branch: 'main' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (ts: string): string => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const statusColor = (status: FixStatus): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const map: Record<FixStatus, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
    applied: 'success', 'rolled-back': 'error', failed: 'warning', pending: 'info',
  };
  return map[status];
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FixCard({ fix, onRollback, onViewDiff }: {
  fix: AppliedFix;
  onRollback: (id: string) => void;
  onViewDiff: (fix: AppliedFix) => void;
}) {
  return (
    <Card variant="outlined" padding="sm" className={fix.status === 'rolled-back' ? 'opacity-60' : 'hover:border-accent/30'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-sm font-medium ${fix.status === 'rolled-back' ? 'text-fg-muted line-through' : 'text-fg'}`}>{fix.description}</span>
            <Badge variant={statusColor(fix.status)} size="sm">{fix.status}</Badge>
            <Badge variant="outline" size="sm">{fix.repo}</Badge>
          </div>
          <div className="text-[10px] text-fg-subtle">{fix.file}</div>
          <div className="flex items-center gap-3 text-[10px] text-fg-subtle mt-1">
            <span>Commit: <code className="text-accent">{fix.commitSha}</code></span>
            <span>{formatTime(fix.appliedAt)}</span>
            <span>By: {fix.appliedBy}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="xs" variant="ghost" onClick={() => onViewDiff(fix)}>Diff</Button>
          {fix.status === 'applied' && (
            <Button size="xs" variant="danger" onClick={() => onRollback(fix.id)}>
              Revert
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function GitHistoryCard({ snapshot }: { snapshot: GitSnapshot }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <code className="text-[10px] text-accent font-mono">{snapshot.sha}</code>
        <span className="text-sm text-fg truncate">{snapshot.message}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 text-[10px] text-fg-subtle">
        <span>{snapshot.author}</span>
        <span>{formatTime(snapshot.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Diff View Modal ──────────────────────────────────────────────────────────

function DiffModal({ fix, open, onClose }: {
  fix: AppliedFix | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!fix) return null;
  return (
    <Modal open={open} onClose={onClose} title="Code Diff" description={fix.description} size="full">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="sm">{fix.repo}</Badge>
          <Badge variant="default" size="sm">{fix.file}</Badge>
          <code className="text-xs text-accent font-mono">{fix.commitSha}</code>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium text-error mb-1">Original</div>
            <pre className="p-3 bg-error/5 border border-error/20 rounded-lg text-xs text-fg overflow-x-auto font-mono">
              <code>{fix.originalCode}</code>
            </pre>
          </div>
          <div>
            <div className="text-xs font-medium text-success mb-1">Fixed</div>
            <pre className="p-3 bg-success/5 border border-success/20 rounded-lg text-xs text-fg overflow-x-auto font-mono">
              <code>{fix.fixedCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Rollback Confirmation Modal ──────────────────────────────────────────────

function RollbackModal({ fix, open, onClose, onConfirm }: {
  fix: AppliedFix | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  const [createPR, setCreatePR] = React.useState(true);
  const [preserveHistory, setPreserveHistory] = React.useState(true);

  if (!fix) return null;

  return (
    <Modal open={open} onClose={onClose} title="Confirm Rollback" description="Revert an applied fix" size="md">
      <div className="space-y-4">
        <Card variant="outlined" padding="sm" className="bg-error/5 border-error/20">
          <div className="text-sm font-medium text-fg">{fix.description}</div>
          <div className="text-[10px] text-fg-subtle mt-1">{fix.repo} &middot; {fix.file}</div>
        </Card>

        <div className="space-y-3">
          <Switch
            checked={createPR}
            onChange={() => setCreatePR(!createPR)}
            label="Create Pull Request"
            description="Open a PR instead of direct push to main"
          />
          <Switch
            checked={preserveHistory}
            onChange={() => setPreserveHistory(!preserveHistory)}
            label="Preserve Git History"
            description="Create a revert commit instead of rewriting history"
          />
        </div>

        <Card variant="outlined" padding="sm">
          <div className="text-xs text-fg-muted mb-1">Rollback will restore:</div>
          <pre className="p-2 bg-bg-tertiary rounded text-[10px] text-fg font-mono overflow-x-auto">
            <code>{fix.originalCode}</code>
          </pre>
        </Card>

        <CardFooter className="px-0 pb-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => { onConfirm(fix.id); onClose(); }}>
            Confirm Rollback
          </Button>
        </CardFooter>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RollbackUndo() {
  const [fixes, setFixes] = React.useState<AppliedFix[]>(appliedFixes);
  const [selectedFix, setSelectedFix] = React.useState<AppliedFix | null>(null);
  const [showDiff, setShowDiff] = React.useState(false);
  const [showRollback, setShowRollback] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'fixes' | 'history'>('fixes');

  const rollbackFix = (id: string) => {
    setFixes((prev) => prev.map((f) => f.id === id ? { ...f, status: 'rolled-back' as const } : f));
  };

  const openDiff = (fix: AppliedFix) => { setSelectedFix(fix); setShowDiff(true); };
  const openRollback = (id: string) => {
    const fix = fixes.find((f) => f.id === id) || null;
    setSelectedFix(fix);
    setShowRollback(true);
  };

  const tabs = [
    { key: 'fixes' as const, label: 'Applied Fixes', count: fixes.filter((f) => f.status === 'applied').length },
    { key: 'history' as const, label: 'Git History', count: gitHistory.length },
  ];

  const appliedCount = fixes.filter((f) => f.status === 'applied').length;
  const rolledBackCount = fixes.filter((f) => f.status === 'rolled-back').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-fg">Rollback & Undo</h2>
          <p className="text-sm text-fg-muted mt-1">One-click revert of applied fixes with full git history preservation</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-success">{appliedCount}</div>
          <div className="text-xs text-fg-muted">Active Fixes</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-error">{rolledBackCount}</div>
          <div className="text-xs text-fg-muted">Rolled Back</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-fg">{fixes.length}</div>
          <div className="text-xs text-fg-muted">Total Fixes</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-accent">{gitHistory.length}</div>
          <div className="text-xs text-fg-muted">Git Commits</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
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
      {activeTab === 'fixes' && (
        <div className="space-y-3">
          {fixes.filter((f) => f.status === 'applied').length > 0 && (
            <Card variant="outlined" padding="sm" className="bg-warning/5 border-warning/20">
              <div className="text-xs text-warning font-medium">Active fixes</div>
              <div className="text-[10px] text-fg-muted mt-0.5">These fixes are currently applied to your codebase. Rollback will revert the changes.</div>
            </Card>
          )}
          {fixes.map((fix) => (
            <FixCard key={fix.id} fix={fix} onRollback={openRollback} onViewDiff={openDiff} />
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Git History</CardTitle>
            <CardDescription>Full commit history including auto-fixes and reverts</CardDescription>
          </CardHeader>
          <CardContent>
            {gitHistory.map((snapshot) => <GitHistoryCard key={snapshot.sha} snapshot={snapshot} />)}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <DiffModal fix={selectedFix} open={showDiff} onClose={() => setShowDiff(false)} />
      <RollbackModal fix={selectedFix} open={showRollback} onClose={() => setShowRollback(false)} onConfirm={rollbackFix} />
    </div>
  );
}

export default RollbackUndo;

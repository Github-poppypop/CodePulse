import * as React from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Input, Select, Switch, Modal } from '../ui';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelCost {
  model: string;
  promptTokens: number;
  completionTokens: number;
  promptCost: number;
  completionCost: number;
  totalCost: number;
  requests: number;
}

interface RepoCost {
  repo: string;
  totalCost: number;
  runs: number;
  avgCostPerRun: number;
  models: string[];
  budgetUsed: number;
  budgetLimit: number;
}

interface RunCost {
  id: string;
  repo: string;
  model: string;
  tokens: number;
  cost: number;
  duration: string;
  timestamp: string;
  findings: number;
}

interface BudgetAlert {
  id: string;
  repo: string;
  limit: number;
  current: number;
  threshold: number;
  triggered: boolean;
}

interface ROIMetrics {
  totalSpent: number;
  issuesFound: number;
  costPerIssue: number;
  hoursSaved: number;
  estimatedManualCost: number;
  netSavings: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const modelCosts: ModelCost[] = [
  { model: 'claude-sonnet-4-20250514', promptTokens: 2450000, completionTokens: 890000, promptCost: 7.35, completionCost: 13.35, totalCost: 20.70, requests: 342 },
  { model: 'gpt-4o', promptTokens: 1890000, completionTokens: 620000, promptCost: 9.45, completionCost: 7.44, totalCost: 16.89, requests: 256 },
  { model: 'gemini-2.5-pro', promptTokens: 3200000, completionTokens: 1100000, promptCost: 4.80, completionCost: 8.80, totalCost: 13.60, requests: 189 },
  { model: 'claude-haiku-4-20250514', promptTokens: 890000, completionTokens: 210000, promptCost: 0.89, completionCost: 1.05, totalCost: 1.94, requests: 520 },
];

const repoCosts: RepoCost[] = [
  { repo: 'api-gateway', totalCost: 12.45, runs: 28, avgCostPerRun: 0.44, models: ['claude-sonnet-4-20250514', 'gpt-4o'], budgetUsed: 12.45, budgetLimit: 50 },
  { repo: 'frontend-app', totalCost: 8.92, runs: 22, avgCostPerRun: 0.41, models: ['claude-sonnet-4-20250514'], budgetUsed: 8.92, budgetLimit: 30 },
  { repo: 'auth-service', totalCost: 15.67, runs: 35, avgCostPerRun: 0.45, models: ['gpt-4o', 'gemini-2.5-pro'], budgetUsed: 15.67, budgetLimit: 20 },
  { repo: 'data-pipeline', totalCost: 3.21, runs: 14, avgCostPerRun: 0.23, models: ['claude-haiku-4-20250514'], budgetUsed: 3.21, budgetLimit: 25 },
  { repo: 'docs-site', totalCost: 1.18, runs: 8, avgCostPerRun: 0.15, models: ['claude-haiku-4-20250514'], budgetUsed: 1.18, budgetLimit: 10 },
];

const recentRuns: RunCost[] = [
  { id: 'run-1', repo: 'api-gateway', model: 'claude-sonnet-4-20250514', tokens: 12400, cost: 0.52, duration: '2m 34s', timestamp: '2026-06-28T10:15:00Z', findings: 3 },
  { id: 'run-2', repo: 'auth-service', model: 'gpt-4o', tokens: 9800, cost: 0.41, duration: '1m 58s', timestamp: '2026-06-28T09:42:00Z', findings: 5 },
  { id: 'run-3', repo: 'frontend-app', model: 'claude-sonnet-4-20250514', tokens: 15200, cost: 0.63, duration: '3m 12s', timestamp: '2026-06-28T09:00:00Z', findings: 2 },
  { id: 'run-4', repo: 'data-pipeline', model: 'claude-haiku-4-20250514', tokens: 5400, cost: 0.11, duration: '1m 05s', timestamp: '2026-06-28T08:30:00Z', findings: 1 },
  { id: 'run-5', repo: 'api-gateway', model: 'gpt-4o', tokens: 11300, cost: 0.47, duration: '2m 18s', timestamp: '2026-06-27T22:10:00Z', findings: 4 },
];

const budgetAlerts: BudgetAlert[] = [
  { id: 'alert-1', repo: 'auth-service', limit: 20, current: 15.67, threshold: 75, triggered: false },
  { id: 'alert-2', repo: 'api-gateway', limit: 50, current: 12.45, threshold: 75, triggered: false },
  { id: 'alert-3', repo: 'docs-site', limit: 10, current: 1.18, threshold: 80, triggered: false },
];

const roiData: ROIMetrics = {
  totalSpent: 41.43,
  issuesFound: 87,
  costPerIssue: 0.48,
  hoursSaved: 45,
  estimatedManualCost: 6750,
  netSavings: 6708.57,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number): string => `$${amount.toFixed(2)}`;
const formatTokens = (tokens: number): string => tokens >= 1000000 ? `${(tokens / 1000000).toFixed(1)}M` : tokens >= 1000 ? `${(tokens / 1000).toFixed(0)}K` : `${tokens}`;
const formatTime = (ts: string): string => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const getBudgetColor = (used: number, limit: number): 'success' | 'warning' | 'error' => {
  const pct = (used / limit) * 100;
  if (pct >= 80) return 'error';
  if (pct >= 50) return 'warning';
  return 'success';
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

function ModelCostRow({ data }: { data: ModelCost }) {
  const totalMax = Math.max(...modelCosts.map((m) => m.totalCost));
  const pct = (data.totalCost / totalMax) * 100;
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-fg truncate">{data.model}</div>
        <div className="mt-1.5 h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-semibold text-fg">{formatCurrency(data.totalCost)}</div>
        <div className="text-[10px] text-fg-subtle">
          {formatTokens(data.promptTokens)}p / {formatTokens(data.completionTokens)}c &middot; {data.requests} req
        </div>
      </div>
    </div>
  );
}

function RepoBudgetRow({ repo, onEditBudget }: { repo: RepoCost; onEditBudget: (repo: string) => void }) {
  const pct = (repo.budgetUsed / repo.budgetLimit) * 100;
  return (
    <Card variant="outlined" padding="sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-fg truncate">{repo.repo}</span>
          <Badge variant={getBudgetColor(repo.budgetUsed, repo.budgetLimit)} size="sm">{pct.toFixed(0)}%</Badge>
        </div>
        <Button size="xs" variant="ghost" onClick={() => onEditBudget(repo.repo)}>Edit Budget</Button>
      </div>
      <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 80 ? 'bg-error' : pct >= 50 ? 'bg-warning' : 'bg-success'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-fg-subtle">
        <span>{formatCurrency(repo.budgetUsed)} / {formatCurrency(repo.budgetLimit)}</span>
        <span>{repo.runs} runs &middot; avg {formatCurrency(repo.avgCostPerRun)}/run</span>
      </div>
    </Card>
  );
}

function BudgetAlertRow({ alert, onDismiss }: { alert: BudgetAlert; onDismiss: (id: string) => void }) {
  const pct = (alert.current / alert.limit) * 100;
  return (
    <Card variant="outlined" padding="sm" className={pct >= 80 ? 'border-error/50' : 'border-warning/50'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={pct >= 80 ? 'error' : 'warning'} size="sm" dot>{pct >= 80 ? 'Critical' : 'Warning'}</Badge>
          <span className="text-sm font-medium text-fg">{alert.repo}</span>
        </div>
        <Button size="xs" variant="ghost" onClick={() => onDismiss(alert.id)}>Dismiss</Button>
      </div>
      <div className="text-xs text-fg-muted mt-1">
        Budget at {pct.toFixed(0)}% ({formatCurrency(alert.current)} of {formatCurrency(alert.limit)})
      </div>
    </Card>
  );
}

function ROICalculator({ roi }: { roi: ROIMetrics }) {
  const [hourlyRate, setHourlyRate] = React.useState('150');
  const [hoursPerIssue, setHoursPerIssue] = React.useState('1');
  const rate = parseFloat(hourlyRate) || 0;
  const hrs = parseFloat(hoursPerIssue) || 0;
  const estimatedManual = roi.issuesFound * hrs * rate;
  const netSavings = estimatedManual - roi.totalSpent;

  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>ROI Calculator</CardTitle>
        <CardDescription>Estimate savings from automated code analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input
            label="Engineer Hourly Rate ($)"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
          />
          <Input
            label="Avg Hours per Issue (manual)"
            type="number"
            value={hoursPerIssue}
            onChange={(e) => setHoursPerIssue(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-bg-tertiary rounded-lg">
            <div className="text-lg font-bold text-fg">{formatCurrency(roi.totalSpent)}</div>
            <div className="text-[10px] text-fg-muted">Total Spent (AI)</div>
          </div>
          <div className="text-center p-3 bg-bg-tertiary rounded-lg">
            <div className="text-lg font-bold text-warning">{formatCurrency(estimatedManual)}</div>
            <div className="text-[10px] text-fg-muted">Est. Manual Cost</div>
          </div>
          <div className="text-center p-3 bg-bg-tertiary rounded-lg">
            <div className="text-lg font-bold text-fg">{roi.issuesFound}</div>
            <div className="text-[10px] text-fg-muted">Issues Found</div>
          </div>
          <div className="text-center p-3 bg-bg-tertiary rounded-lg">
            <div className={`text-lg font-bold ${netSavings >= 0 ? 'text-success' : 'text-error'}`}>
              {formatCurrency(netSavings)}
            </div>
            <div className="text-[10px] text-fg-muted">Net Savings</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Edit Budget Modal ────────────────────────────────────────────────────────

function EditBudgetModal({ open, onClose, repo, onSave }: {
  open: boolean;
  onClose: () => void;
  repo: string;
  onSave: (repo: string, limit: number) => void;
}) {
  const [limit, setLimit] = React.useState('50');

  React.useEffect(() => {
    const existing = repoCosts.find((r) => r.repo === repo);
    if (existing) setLimit(existing.budgetLimit.toString());
  }, [repo, open]);

  const handleSave = () => {
    onSave(repo, parseFloat(limit) || 50);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Budget" description={`Set monthly budget limit for ${repo}`} size="sm">
      <div className="space-y-4">
        <Input
          label="Monthly Budget Limit ($)"
          type="number"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          hint="Alert will trigger at 75% of this limit"
        />
        <CardFooter className="px-0 pb-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Budget</Button>
        </CardFooter>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CostDashboard() {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'models' | 'repos' | 'budgets' | 'roi'>('overview');
  const [editRepo, setEditRepo] = React.useState<string | null>(null);
  const [alerts, setAlerts] = React.useState<BudgetAlert[]>(budgetAlerts);
  const [repos, setRepos] = React.useState<RepoCost[]>(repoCosts);

  const totalCost = repos.reduce((sum, r) => sum + r.totalCost, 0);
  const totalRuns = repos.reduce((sum, r) => sum + r.runs, 0);

  const dismissAlert = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  const saveBudget = (repoName: string, limit: number) => {
    setRepos((prev) => prev.map((r) => r.repo === repoName ? { ...r, budgetLimit: limit } : r));
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'models' as const, label: 'By Model' },
    { key: 'repos' as const, label: 'By Repo' },
    { key: 'budgets' as const, label: 'Budgets' },
    { key: 'roi' as const, label: 'ROI' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-fg">Cost Dashboard</h2>
          <p className="text-sm text-fg-muted mt-1">Track AI usage costs, set budgets, and calculate ROI</p>
        </div>
        <Select
          options={[
            { value: '7d', label: 'Last 7 days' },
            { value: '30d', label: 'Last 30 days' },
            { value: '90d', label: 'Last 90 days' },
          ]}
          defaultValue="30d"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Cost (MTD)" value={formatCurrency(totalCost)} sub={`${totalRuns} runs`} accent="text-accent" />
        <StatCard label="Cost per Run" value={formatCurrency(totalCost / totalRuns)} sub="Average across repos" />
        <StatCard label="Issues Found" value={roiData.issuesFound.toString()} sub={`${formatCurrency(roiData.costPerIssue)}/issue`} accent="text-success" />
        <StatCard label="Active Models" value={modelCosts.length.toString()} sub={`${modelCosts.reduce((s, m) => s + m.requests, 0)} total requests`} />
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
            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Recent Runs</CardTitle>
              <CardDescription>Latest analysis runs and their costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm text-fg truncate">{run.repo}</div>
                        <div className="text-[10px] text-fg-subtle">{run.model} &middot; {formatTokens(run.tokens)} tokens &middot; {run.duration}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-fg">{formatCurrency(run.cost)}</div>
                      <div className="text-[10px] text-fg-subtle">{run.findings} findings</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'models' && (
        <Card variant="default" padding="md">
          <CardHeader>
            <CardTitle>Cost by Model</CardTitle>
            <CardDescription>Breakdown of token usage and costs per AI model</CardDescription>
          </CardHeader>
          <CardContent>
            {modelCosts.map((m) => <ModelCostRow key={m.model} data={m} />)}
          </CardContent>
        </Card>
      )}

      {activeTab === 'repos' && (
        <div className="space-y-3">
          {repos.map((repo) => (
            <RepoBudgetRow key={repo.repo} repo={repo} onEditBudget={(r) => setEditRepo(r)} />
          ))}
        </div>
      )}

      {activeTab === 'budgets' && (
        <div className="space-y-4">
          {alerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-fg">Active Alerts</h3>
              {alerts.map((alert) => (
                <BudgetAlertRow key={alert.id} alert={alert} onDismiss={dismissAlert} />
              ))}
            </div>
          )}
          <Card variant="default" padding="md">
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>Monthly spending limits per repository</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {repos.map((repo) => (
                  <div key={repo.repo} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-fg">{repo.repo}</span>
                      <Badge variant={getBudgetColor(repo.budgetUsed, repo.budgetLimit)} size="sm">
                        {((repo.budgetUsed / repo.budgetLimit) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <span className="text-sm text-fg-muted">
                      {formatCurrency(repo.budgetUsed)} / {formatCurrency(repo.budgetLimit)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'roi' && <ROICalculator roi={roiData} />}

      {editRepo && (
        <EditBudgetModal open={!!editRepo} onClose={() => setEditRepo(null)} repo={editRepo} onSave={saveBudget} />
      )}
    </div>
  );
}

export default CostDashboard;

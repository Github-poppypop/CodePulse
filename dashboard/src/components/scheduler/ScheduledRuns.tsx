import * as React from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Input, Select, Switch, Modal } from '../ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type TriggerType = 'cron' | 'on-commit' | 'pr-opened' | 'weekly-digest' | 'custom';
type ScheduleStatus = 'active' | 'paused' | 'error' | 'completed';

interface ScheduledRun {
  id: string;
  name: string;
  trigger: TriggerType;
  schedule: string;
  repo: string;
  model: string;
  status: ScheduleStatus;
  lastRun?: string;
  nextRun?: string;
  runsCount: number;
}

interface TriggerConfig {
  type: TriggerType;
  label: string;
  description: string;
  icon: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const triggers: TriggerConfig[] = [
  { type: 'cron', label: 'Cron Schedule', description: 'Run on a fixed schedule (e.g. every 6 hours)', icon: '⏰' },
  { type: 'on-commit', label: 'On Commit', description: 'Trigger when code is pushed to a branch', icon: '⬆' },
  { type: 'pr-opened', label: 'PR Opened', description: 'Analyze when a pull request is created', icon: '↗' },
  { type: 'weekly-digest', label: 'Weekly Digest', description: 'Aggregate findings into a weekly report', icon: '📊' },
  { type: 'custom', label: 'Custom Trigger', description: 'Webhook-based custom triggers', icon: '🔧' },
];

const initialSchedules: ScheduledRun[] = [
  { id: 'sched-1', name: 'Hourly Security Scan', trigger: 'cron', schedule: '0 * * * *', repo: 'api-gateway', model: 'claude-sonnet-4-20250514', status: 'active', lastRun: '2026-06-28T10:00:00Z', nextRun: '2026-06-28T11:00:00Z', runsCount: 156 },
  { id: 'sched-2', name: 'Commit Analysis', trigger: 'on-commit', schedule: 'on push to main', repo: 'frontend-app', model: 'gpt-4o', status: 'active', lastRun: '2026-06-28T09:45:00Z', nextRun: 'On next push', runsCount: 89 },
  { id: 'sched-3', name: 'PR Review Bot', trigger: 'pr-opened', schedule: 'on PR creation', repo: '*', model: 'claude-sonnet-4-20250514', status: 'active', lastRun: '2026-06-28T08:30:00Z', nextRun: 'On next PR', runsCount: 34 },
  { id: 'sched-4', name: 'Weekly Summary', trigger: 'weekly-digest', schedule: 'Every Monday 9:00 AM', repo: '*', model: 'gpt-4o', status: 'active', lastRun: '2026-06-23T09:00:00Z', nextRun: '2026-06-30T09:00:00Z', runsCount: 8 },
  { id: 'sched-5', name: 'Custom Webhook', trigger: 'custom', schedule: 'POST /api/trigger/scan', repo: 'auth-service', model: 'gemini-2.5-pro', status: 'paused', lastRun: '2026-06-27T15:00:00Z', nextRun: 'Manual', runsCount: 12 },
  { id: 'sched-6', name: 'Nightly Deep Scan', trigger: 'cron', schedule: '0 2 * * *', repo: 'data-pipeline', model: 'claude-sonnet-4-20250514', status: 'error', lastRun: '2026-06-28T02:00:00Z', nextRun: '2026-06-29T02:00:00Z', runsCount: 45 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (ts: string): string => {
  if (!ts) return 'Never';
  if (ts.startsWith('On ') || ts === 'Manual') return ts;
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusColor = (status: ScheduleStatus): 'success' | 'warning' | 'error' | 'info' => {
  const map: Record<ScheduleStatus, 'success' | 'warning' | 'error' | 'info'> = {
    active: 'success', paused: 'warning', error: 'error', completed: 'info',
  };
  return map[status];
};

const triggerColor = (trigger: TriggerType): 'info' | 'success' | 'warning' | 'error' | 'default' => {
  const map: Record<TriggerType, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
    cron: 'info', 'on-commit': 'success', 'pr-opened': 'warning', 'weekly-digest': 'error', custom: 'default',
  };
  return map[trigger];
};

const getTriggerConfig = (type: TriggerType): TriggerConfig => triggers.find((t) => t.type === type) || triggers[0];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ScheduleCard({ schedule, onToggle, onRun, onDelete }: {
  schedule: ScheduledRun;
  onToggle: (id: string) => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const trigger = getTriggerConfig(schedule.trigger);
  return (
    <Card variant="outlined" padding="sm" className="hover:border-accent/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-medium text-fg">{schedule.name}</span>
            <Badge variant={statusColor(schedule.status)} size="sm" dot>{schedule.status}</Badge>
            <Badge variant={triggerColor(schedule.trigger)} size="sm">{trigger.label}</Badge>
          </div>
          <div className="text-xs text-fg-muted mb-1">{trigger.description}</div>
          <div className="flex items-center gap-3 text-[10px] text-fg-subtle flex-wrap">
            <span>Schedule: {schedule.schedule}</span>
            <span>Repo: {schedule.repo}</span>
            <span>Model: {schedule.model}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-fg-subtle mt-1">
            <span>Last: {formatTime(schedule.lastRun || '')}</span>
            <span>Next: {formatTime(schedule.nextRun || '')}</span>
            <span>{schedule.runsCount} runs</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button size="xs" variant="ghost" onClick={() => onRun(schedule.id)} title="Run now">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3l12 7-12 7V3z" /></svg>
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onToggle(schedule.id)} title={schedule.status === 'active' ? 'Pause' : 'Resume'}>
            {schedule.status === 'active' ? (
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><rect x="5" y="4" width="3" height="12" rx="1" /><rect x="12" y="4" width="3" height="12" rx="1" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3l12 7-12 7V3z" /></svg>
            )}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => onDelete(schedule.id)} title="Delete">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-10 10M5 5l10 10" /></svg>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function TriggerTypeCard({ trigger, selected, onSelect }: {
  trigger: TriggerConfig;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`p-3 rounded-lg border text-left transition-all ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-bg-tertiary hover:border-border-hover'
      }`}
    >
      <div className="text-lg mb-1">{trigger.icon}</div>
      <div className="text-sm font-medium text-fg">{trigger.label}</div>
      <div className="text-[10px] text-fg-muted mt-0.5">{trigger.description}</div>
    </button>
  );
}

// ─── Create Schedule Modal ────────────────────────────────────────────────────

function CreateScheduleModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (schedule: Omit<ScheduledRun, 'id' | 'runsCount' | 'status'>) => void;
}) {
  const [name, setName] = React.useState('');
  const [triggerType, setTriggerType] = React.useState<TriggerType>('cron');
  const [cronExpr, setCronExpr] = React.useState('0 * * * *');
  const [repo, setRepo] = React.useState('');
  const [model, setModel] = React.useState('claude-sonnet-4-20250514');

  const handleSubmit = () => {
    if (!name || !repo) return;
    const scheduleMap: Record<TriggerType, string> = {
      cron: cronExpr,
      'on-commit': 'on push to main',
      'pr-opened': 'on PR creation',
      'weekly-digest': 'Every Monday 9:00 AM',
      custom: 'POST /api/trigger/scan',
    };
    onCreate({
      name,
      trigger: triggerType,
      schedule: scheduleMap[triggerType],
      repo,
      model,
      lastRun: undefined,
      nextRun: 'Pending',
    });
    setName(''); setRepo(''); setCronExpr('0 * * * *'); setTriggerType('cron');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Scheduled Run" description="Configure automated analysis triggers" size="lg">
      <div className="space-y-4">
        <Input label="Schedule Name" placeholder="e.g. Hourly Security Scan" value={name} onChange={(e) => setName(e.target.value)} />

        <div>
          <label className="block text-sm font-medium text-fg mb-2">Trigger Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {triggers.map((t) => (
              <TriggerTypeCard key={t.type} trigger={t} selected={triggerType === t.type} onSelect={() => setTriggerType(t.type)} />
            ))}
          </div>
        </div>

        {triggerType === 'cron' && (
          <Input label="Cron Expression" placeholder="0 * * * *" value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} hint="Format: minute hour day month weekday" />
        )}

        <Input label="Repository" placeholder="repo-name or * for all" value={repo} onChange={(e) => setRepo(e.target.value)} />

        <Select
          label="Model"
          options={[
            { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
            { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4' },
          ]}
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />

        <CardFooter className="mt-6 px-0 pb-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || !repo}>Create Schedule</Button>
        </CardFooter>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScheduledRuns() {
  const [schedules, setSchedules] = React.useState<ScheduledRun[]>(initialSchedules);
  const [showCreate, setShowCreate] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | TriggerType>('all');

  const toggleSchedule = (id: string) => {
    setSchedules((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      return { ...s, status: s.status === 'active' ? 'paused' as const : 'active' as const };
    }));
  };

  const runNow = (id: string) => {
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, lastRun: new Date().toISOString(), runsCount: s.runsCount + 1 } : s));
  };

  const deleteSchedule = (id: string) => setSchedules((prev) => prev.filter((s) => s.id !== id));

  const createSchedule = (data: Omit<ScheduledRun, 'id' | 'runsCount' | 'status'>) => {
    setSchedules((prev) => [...prev, { ...data, id: `sched-${Date.now()}`, runsCount: 0, status: 'active' }]);
  };

  const filtered = filter === 'all' ? schedules : schedules.filter((s) => s.trigger === filter);
  const activeCount = schedules.filter((s) => s.status === 'active').length;
  const totalRuns = schedules.reduce((sum, s) => sum + s.runsCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-fg">Scheduled Runs</h2>
          <p className="text-sm text-fg-muted mt-1">Automated analysis with cron, commit, PR, and custom triggers</p>
        </div>
        <Button onClick={() => setShowCreate(true)} leftIcon={<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 5v10M5 10h10" /></svg>}>
          New Schedule
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-fg">{schedules.length}</div>
          <div className="text-xs text-fg-muted">Total Schedules</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-success">{activeCount}</div>
          <div className="text-xs text-fg-muted">Active</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-accent">{totalRuns}</div>
          <div className="text-xs text-fg-muted">Total Runs</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-error">{schedules.filter((s) => s.status === 'error').length}</div>
          <div className="text-xs text-fg-muted">Errors</div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            filter === 'all' ? 'bg-accent/20 border-accent text-accent' : 'bg-bg-tertiary border-border text-fg-muted hover:border-border-hover'
          }`}
        >
          All ({schedules.length})
        </button>
        {triggers.map((t) => {
          const count = schedules.filter((s) => s.trigger === t.type).length;
          return (
            <button
              key={t.type}
              onClick={() => setFilter(t.type)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                filter === t.type ? 'bg-accent/20 border-accent text-accent' : 'bg-bg-tertiary border-border text-fg-muted hover:border-border-hover'
              }`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Schedule List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card variant="outlined" padding="md">
            <div className="text-center py-6 text-fg-muted text-sm">No schedules match this filter</div>
          </Card>
        ) : (
          filtered.map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} onToggle={toggleSchedule} onRun={runNow} onDelete={deleteSchedule} />
          ))
        )}
      </div>

      <CreateScheduleModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={createSchedule} />
    </div>
  );
}

export default ScheduledRuns;

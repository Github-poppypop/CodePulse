import * as React from 'react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Input, Select, Switch, Modal } from '../ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type WebhookChannel = 'slack' | 'discord' | 'email' | 'teams';
type DigestMode = 'realtime' | 'hourly' | 'daily' | 'weekly';
type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface WebhookConfig {
  id: string;
  channel: WebhookChannel;
  url: string;
  label: string;
  enabled: boolean;
  lastTested?: string;
  status: 'active' | 'error' | 'pending';
}

interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  severity: NotificationSeverity[];
  channels: WebhookChannel[];
  repos: string[];
  description: string;
}

interface NotificationEvent {
  id: string;
  timestamp: string;
  channel: WebhookChannel;
  severity: NotificationSeverity;
  repo: string;
  message: string;
  delivered: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const initialWebhooks: WebhookConfig[] = [
  { id: 'wh-1', channel: 'slack', url: 'https://hooks.slack.com/services/T00/B00/xxx', label: 'Engineering Alerts', enabled: true, lastTested: '2026-06-27T14:30:00Z', status: 'active' },
  { id: 'wh-2', channel: 'discord', url: 'https://discord.com/api/webhooks/123/abc', label: 'DevOps Channel', enabled: true, lastTested: '2026-06-26T09:15:00Z', status: 'active' },
  { id: 'wh-3', channel: 'email', url: 'smtp://alerts@codepulse.io', label: 'Security Team', enabled: false, status: 'pending' },
  { id: 'wh-4', channel: 'teams', url: 'https://outlook.office.com/webhook/xxx', label: 'Management Digest', enabled: true, lastTested: '2026-06-25T18:00:00Z', status: 'error' },
];

const initialRules: RoutingRule[] = [
  { id: 'rule-1', name: 'Critical Security Findings', enabled: true, severity: ['critical'], channels: ['slack', 'email'], repos: ['*'], description: 'Immediately notify on critical security issues across all repos' },
  { id: 'rule-2', name: 'High Severity to Discord', enabled: true, severity: ['high'], channels: ['discord'], repos: ['frontend-app', 'api-gateway'], description: 'Route high severity findings for core services to Discord' },
  { id: 'rule-3', name: 'Weekly Management Digest', enabled: true, severity: ['critical', 'high', 'medium'], channels: ['teams'], repos: ['*'], description: 'Weekly summary of all significant findings to management' },
  { id: 'rule-4', name: 'Low Priority Batch', enabled: false, severity: ['low', 'info'], channels: ['slack'], repos: ['docs-site'], description: 'Batch low-priority findings from documentation repo' },
];

const recentEvents: NotificationEvent[] = [
  { id: 'ev-1', timestamp: '2026-06-28T10:23:00Z', channel: 'slack', severity: 'critical', repo: 'api-gateway', message: 'SQL injection vulnerability detected in /api/users endpoint', delivered: true },
  { id: 'ev-2', timestamp: '2026-06-28T09:45:00Z', channel: 'discord', severity: 'high', repo: 'frontend-app', message: 'XSS vulnerability in search component', delivered: true },
  { id: 'ev-3', timestamp: '2026-06-28T08:00:00Z', channel: 'teams', severity: 'medium', repo: 'auth-service', message: 'Weak JWT signing algorithm detected', delivered: false },
  { id: 'ev-4', timestamp: '2026-06-27T22:10:00Z', channel: 'slack', severity: 'low', repo: 'docs-site', message: 'Outdated dependency: lodash@4.17.20', delivered: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const channelIcon = (channel: WebhookChannel): string => {
  const icons: Record<WebhookChannel, string> = { slack: 'S', discord: 'D', email: '@', teams: 'T' };
  return icons[channel];
};

const severityColor = (severity: NotificationSeverity): 'error' | 'warning' | 'info' | 'success' | 'default' => {
  const map: Record<NotificationSeverity, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
    critical: 'error', high: 'warning', medium: 'info', low: 'success', info: 'default',
  };
  return map[severity];
};

const statusColor = (status: string): 'success' | 'error' | 'warning' => {
  const map: Record<string, 'success' | 'error' | 'warning'> = { active: 'success', error: 'error', pending: 'warning' };
  return map[status] || 'warning';
};

const formatTime = (ts: string): string => {
  const d = new Date(ts);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function WebhookCard({ webhook, onToggle, onTest, onDelete }: {
  webhook: WebhookConfig;
  onToggle: (id: string) => void;
  onTest: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card variant="outlined" padding="sm" className="hover:border-accent/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
            {channelIcon(webhook.channel)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-fg truncate">{webhook.label}</span>
              <Badge variant={statusColor(webhook.status)} size="sm">{webhook.status}</Badge>
            </div>
            <p className="text-xs text-fg-muted truncate">{webhook.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Switch checked={webhook.enabled} onChange={() => onToggle(webhook.id)} size="sm" />
          <Button size="xs" variant="ghost" onClick={() => onTest(webhook.id)}>Test</Button>
          <Button size="xs" variant="ghost" onClick={() => onDelete(webhook.id)}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-10 10M5 5l10 10" /></svg>
          </Button>
        </div>
      </div>
      {webhook.lastTested && (
        <p className="text-[10px] text-fg-subtle mt-2">Last tested: {formatTime(webhook.lastTested)}</p>
      )}
    </Card>
  );
}

function RoutingRuleCard({ rule, onToggle, onDelete }: {
  rule: RoutingRule;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card variant="outlined" padding="sm" className="hover:border-accent/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-fg">{rule.name}</span>
            <Switch checked={rule.enabled} onChange={() => onToggle(rule.id)} size="sm" />
          </div>
          <p className="text-xs text-fg-muted mb-2">{rule.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {rule.severity.map((s) => (
              <Badge key={s} variant={severityColor(s)} size="sm">{s}</Badge>
            ))}
            <span className="text-[10px] text-fg-subtle mx-1">&rarr;</span>
            {rule.channels.map((c) => (
              <Badge key={c} variant="outline" size="sm">{c}</Badge>
            ))}
            <span className="text-[10px] text-fg-subtle mx-1">&rarr;</span>
            {rule.repos.map((r) => (
              <Badge key={r} variant="default" size="sm">{r}</Badge>
            ))}
          </div>
        </div>
        <Button size="xs" variant="ghost" onClick={() => onDelete(rule.id)}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-10 10M5 5l10 10" /></svg>
        </Button>
      </div>
    </Card>
  );
}

// ─── Add Webhook Modal ────────────────────────────────────────────────────────

function AddWebhookModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (webhook: Omit<WebhookConfig, 'id' | 'status'>) => void;
}) {
  const [channel, setChannel] = React.useState<WebhookChannel>('slack');
  const [url, setUrl] = React.useState('');
  const [label, setLabel] = React.useState('');

  const handleSubmit = () => {
    if (!url || !label) return;
    onAdd({ channel, url, label, enabled: true });
    setUrl(''); setLabel(''); setChannel('slack');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Webhook" description="Configure a new notification channel" size="md">
      <div className="space-y-4">
        <Select
          label="Channel Type"
          options={[
            { value: 'slack', label: 'Slack' },
            { value: 'discord', label: 'Discord' },
            { value: 'email', label: 'Email (SMTP)' },
            { value: 'teams', label: 'Microsoft Teams' },
          ]}
          value={channel}
          onChange={(e) => setChannel(e.target.value as WebhookChannel)}
        />
        <Input label="Label" placeholder="e.g. Engineering Alerts" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input label="Webhook URL" placeholder="https://hooks.slack.com/services/..." value={url} onChange={(e) => setUrl(e.target.value)} hint={channel === 'email' ? 'Use smtp:// format' : 'Paste the incoming webhook URL'} />
        <CardFooter className="mt-6 px-0 pb-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!url || !label}>Add Webhook</Button>
        </CardFooter>
      </div>
    </Modal>
  );
}

// ─── Add Rule Modal ───────────────────────────────────────────────────────────

function AddRuleModal({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (rule: Omit<RoutingRule, 'id'>) => void;
}) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [selectedSeverities, setSelectedSeverities] = React.useState<NotificationSeverity[]>(['high']);
  const [selectedChannels, setSelectedChannels] = React.useState<WebhookChannel[]>(['slack']);
  const [repos, setRepos] = React.useState('');

  const toggleSeverity = (s: NotificationSeverity) => {
    setSelectedSeverities((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const toggleChannel = (c: WebhookChannel) => {
    setSelectedChannels((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const handleSubmit = () => {
    if (!name || selectedSeverities.length === 0 || selectedChannels.length === 0) return;
    onAdd({
      name,
      description,
      enabled: true,
      severity: selectedSeverities,
      channels: selectedChannels,
      repos: repos.split(',').map((r) => r.trim()).filter(Boolean),
    });
    setName(''); setDescription(''); setSelectedSeverities(['high']); setSelectedChannels(['slack']); setRepos('');
    onClose();
  };

  const allSeverities: NotificationSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const allChannels: WebhookChannel[] = ['slack', 'discord', 'email', 'teams'];

  return (
    <Modal open={open} onClose={onClose} title="Add Routing Rule" description="Define how notifications are routed" size="lg">
      <div className="space-y-4">
        <Input label="Rule Name" placeholder="e.g. Critical Security Alerts" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Description" placeholder="What does this rule do?" value={description} onChange={(e) => setDescription(e.target.value)} />

        <div>
          <label className="block text-sm font-medium text-fg mb-2">Severity Levels</label>
          <div className="flex flex-wrap gap-2">
            {allSeverities.map((s) => (
              <button
                key={s}
                onClick={() => toggleSeverity(s)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  selectedSeverities.includes(s)
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-bg-tertiary border-border text-fg-muted hover:border-border-hover'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-fg mb-2">Channels</label>
          <div className="flex flex-wrap gap-2">
            {allChannels.map((c) => (
              <button
                key={c}
                onClick={() => toggleChannel(c)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                  selectedChannels.includes(c)
                    ? 'bg-accent/20 border-accent text-accent'
                    : 'bg-bg-tertiary border-border text-fg-muted hover:border-border-hover'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <Input label="Repositories" placeholder="Comma-separated, or * for all" value={repos} onChange={(e) => setRepos(e.target.value)} hint="Leave empty for all repositories" />

        <CardFooter className="mt-6 px-0 pb-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || selectedSeverities.length === 0 || selectedChannels.length === 0}>Create Rule</Button>
        </CardFooter>
      </div>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SmartNotifications() {
  const [webhooks, setWebhooks] = React.useState<WebhookConfig[]>(initialWebhooks);
  const [rules, setRules] = React.useState<RoutingRule[]>(initialRules);
  const [digestMode, setDigestMode] = React.useState<DigestMode>('realtime');
  const [showAddWebhook, setShowAddWebhook] = React.useState(false);
  const [showAddRule, setShowAddRule] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'webhooks' | 'rules' | 'history'>('webhooks');

  const toggleWebhook = (id: string) => {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const testWebhook = (id: string) => {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, lastTested: new Date().toISOString(), status: 'active' as const } : w));
  };

  const deleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const addWebhook = (config: Omit<WebhookConfig, 'id' | 'status'>) => {
    setWebhooks((prev) => [...prev, { ...config, id: `wh-${Date.now()}`, status: 'pending' }]);
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const addRule = (rule: Omit<RoutingRule, 'id'>) => {
    setRules((prev) => [...prev, { ...rule, id: `rule-${Date.now()}` }]);
  };

  const tabs = [
    { key: 'webhooks' as const, label: 'Webhooks', count: webhooks.length },
    { key: 'rules' as const, label: 'Routing Rules', count: rules.length },
    { key: 'history' as const, label: 'History', count: recentEvents.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-fg">Smart Notifications</h2>
          <p className="text-sm text-fg-muted mt-1">Multi-channel alerts with intelligent routing and digest modes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'realtime', label: 'Real-time' },
              { value: 'hourly', label: 'Hourly Digest' },
              { value: 'daily', label: 'Daily Digest' },
              { value: 'weekly', label: 'Weekly Digest' },
            ]}
            value={digestMode}
            onChange={(e) => setDigestMode(e.target.value as DigestMode)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-fg">{webhooks.filter((w) => w.enabled).length}</div>
          <div className="text-xs text-fg-muted">Active Webhooks</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-fg">{rules.filter((r) => r.enabled).length}</div>
          <div className="text-xs text-fg-muted">Routing Rules</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-success">{recentEvents.filter((e) => e.delivered).length}</div>
          <div className="text-xs text-fg-muted">Delivered (24h)</div>
        </Card>
        <Card variant="outlined" padding="sm">
          <div className="text-2xl font-bold text-error">{recentEvents.filter((e) => !e.delivered).length}</div>
          <div className="text-xs text-fg-muted">Failed (24h)</div>
        </Card>
      </div>

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
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'webhooks' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddWebhook(true)} leftIcon={<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 5v10M5 10h10" /></svg>}>
              Add Webhook
            </Button>
          </div>
          {webhooks.map((wh) => (
            <WebhookCard key={wh.id} webhook={wh} onToggle={toggleWebhook} onTest={testWebhook} onDelete={deleteWebhook} />
          ))}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAddRule(true)} leftIcon={<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 5v10M5 10h10" /></svg>}>
              Add Rule
            </Button>
          </div>
          {rules.map((rule) => (
            <RoutingRuleCard key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-2">
          {recentEvents.map((event) => (
            <Card key={event.id} variant="outlined" padding="sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded bg-bg-tertiary flex items-center justify-center text-xs font-bold text-accent flex-shrink-0 mt-0.5">
                    {channelIcon(event.channel)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={severityColor(event.severity)} size="sm">{event.severity}</Badge>
                      <Badge variant="outline" size="sm">{event.repo}</Badge>
                      <span className="text-[10px] text-fg-subtle">{formatTime(event.timestamp)}</span>
                    </div>
                    <p className="text-xs text-fg-muted mt-1 truncate">{event.message}</p>
                  </div>
                </div>
                <Badge variant={event.delivered ? 'success' : 'error'} size="sm">{event.delivered ? 'Sent' : 'Failed'}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddWebhookModal open={showAddWebhook} onClose={() => setShowAddWebhook(false)} onAdd={addWebhook} />
      <AddRuleModal open={showAddRule} onClose={() => setShowAddRule(false)} onAdd={addRule} />
    </div>
  );
}

export default SmartNotifications;

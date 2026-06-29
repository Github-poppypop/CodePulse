import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  category: string;
  params?: string[];
}

interface WebhookEvent {
  event: string;
  description: string;
  payload: string;
}

interface SDK {
  language: string;
  package: string;
  install: string;
  version: string;
}

const apiEndpoints: APIEndpoint[] = [
  { method: 'GET', path: '/api/v1/repos', description: 'List all repositories', category: 'Repositories' },
  { method: 'POST', path: '/api/v1/repos', description: 'Register a new repository', category: 'Repositories' },
  { method: 'GET', path: '/api/v1/repos/:id', description: 'Get repository details', category: 'Repositories' },
  { method: 'DELETE', path: '/api/v1/repos/:id', description: 'Remove a repository', category: 'Repositories' },
  { method: 'GET', path: '/api/v1/findings', description: 'List findings with filters', category: 'Findings' },
  { method: 'GET', path: '/api/v1/findings/:id', description: 'Get finding details', category: 'Findings' },
  { method: 'PATCH', path: '/api/v1/findings/:id', description: 'Update finding status', category: 'Findings' },
  { method: 'POST', path: '/api/v1/findings/:id/approve', description: 'Approve a fix', category: 'Findings' },
  { method: 'POST', path: '/api/v1/findings/:id/reject', description: 'Reject a fix', category: 'Findings' },
  { method: 'GET', path: '/api/v1/runs', description: 'List analysis runs', category: 'Runs' },
  { method: 'POST', path: '/api/v1/runs', description: 'Trigger a new run', category: 'Runs' },
  { method: 'GET', path: '/api/v1/runs/:id', description: 'Get run details', category: 'Runs' },
  { method: 'POST', path: '/api/v1/runs/:id/cancel', description: 'Cancel a running analysis', category: 'Runs' },
  { method: 'GET', path: '/api/v1/stats', description: 'Get aggregate statistics', category: 'Stats' },
  { method: 'POST', path: '/api/v1/webhooks', description: 'Register a webhook', category: 'Webhooks' },
  { method: 'DELETE', path: '/api/v1/webhooks/:id', description: 'Delete a webhook', category: 'Webhooks' },
];

const webhookEvents: WebhookEvent[] = [
  { event: 'run.started', description: 'Triggered when a new analysis run begins', payload: '{ "run_id": "string", "repo_id": "string", "trigger": "string" }' },
  { event: 'run.completed', description: 'Triggered when a run finishes successfully', payload: '{ "run_id": "string", "findings_count": 12, "duration_ms": 45000 }' },
  { event: 'run.failed', description: 'Triggered when a run fails', payload: '{ "run_id": "string", "error": "string", "retry_count": 2 }' },
  { event: 'finding.created', description: 'Triggered when a new finding is detected', payload: '{ "finding_id": "string", "severity": "HIGH", "category": "BUG" }' },
  { event: 'finding.fixed', description: 'Triggered when a finding is marked as fixed', payload: '{ "finding_id": "string", "fix_type": "auto" | "manual" }' },
  { event: 'finding.approved', description: 'Triggered when a fix is approved', payload: '{ "finding_id": "string", "approved_by": "string" }' },
  { event: 'finding.rejected', description: 'Triggered when a fix is rejected', payload: '{ "finding_id": "string", "reason": "string" }' },
  { event: 'repo.added', description: 'Triggered when a repository is registered', payload: '{ "repo_id": "string", "name": "string" }' },
  { event: 'repo.removed', description: 'Triggered when a repository is removed', payload: '{ "repo_id": "string" }' },
];

const sdks: SDK[] = [
  { language: 'TypeScript', package: '@codepulse/sdk', install: 'npm install @codepulse/sdk', version: 'v3.2.1' },
  { language: 'Python', package: 'codepulse-sdk', install: 'pip install codepulse-sdk', version: 'v3.2.0' },
  { language: 'Go', package: 'github.com/codepulse/sdk-go', install: 'go get github.com/codepulse/sdk-go', version: 'v3.1.4' },
  { language: 'Ruby', package: 'codepulse-sdk', install: 'gem install codepulse-sdk', version: 'v2.9.0' },
  { language: 'Rust', package: 'codepulse-sdk', install: 'cargo add codepulse-sdk', version: 'v1.4.2' },
];

const methodColors: Record<string, string> = {
  GET: 'bg-green/20 text-green',
  POST: 'bg-blue/20 text-blue',
  PUT: 'bg-yellow/20 text-yellow',
  DELETE: 'bg-red/20 text-red',
  PATCH: 'bg-purple/20 text-purple',
};

export function APIWebhooks() {
  const [activeTab, setActiveTab] = React.useState<'rest' | 'graphql' | 'webhooks' | 'sdks'>('rest');
  const [apiKey, setApiKey] = React.useState('cp_live_xxxxxxxxxxxxxxxxxxxxxxxx');
  const [showKey, setShowKey] = React.useState(false);
  const [webhookUrl, setWebhookUrl] = React.useState('');
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>(['run.completed', 'finding.created']);
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredEndpoints = apiEndpoints.filter(e =>
    e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(filteredEndpoints.map(e => e.category))];

  const toggleEvent = (event: string) => {
    setSelectedEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">API & Webhooks</h2>
          <p className="text-sm text-fg-muted mt-1">Full REST/GraphQL API documentation with webhook lifecycle events</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>API Operational</Badge>
          <span className="text-xs text-fg-muted">v3.2</span>
        </div>
      </div>

      {/* API Key */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-fg">API Key</div>
              <div className="text-xs text-fg-muted mt-1">Use this key to authenticate API requests</div>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-bg-tertiary px-3 py-1.5 rounded-lg font-mono text-fg">
                {showKey ? apiKey : '••••••••••••••••••••••••'}
              </code>
              <Button size="sm" variant="ghost" onClick={() => setShowKey(!showKey)}>
                {showKey ? 'Hide' : 'Show'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(apiKey)}>Copy</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg w-fit">
        {(['rest', 'graphql', 'webhooks', 'sdks'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize',
              activeTab === tab ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
            )}
          >
            {tab === 'rest' ? 'REST API' : tab === 'graphql' ? 'GraphQL' : tab}
          </button>
        ))}
      </div>

      {/* REST API Tab */}
      {activeTab === 'rest' && (
        <div className="space-y-4">
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            leftIcon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="5" /><path d="M10 10l5 5" /></svg>}
          />
          {categories.map(category => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredEndpoints.filter(e => e.category === category).map((endpoint, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg hover:bg-bg-hover transition-colors">
                      <span className={cn('px-2 py-0.5 text-xs font-bold rounded', methodColors[endpoint.method])}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-fg flex-1">{endpoint.path}</code>
                      <span className="text-xs text-fg-muted hidden md:block">{endpoint.description}</span>
                      <Button size="xs" variant="ghost" onClick={() => copyToClipboard(endpoint.path)}>Copy</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* GraphQL Tab */}
      {activeTab === 'graphql' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GraphQL Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-bg-tertiary rounded-lg p-4 font-mono text-sm text-fg">
                POST https://api.codepulse.io/graphql
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Example Query</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-bg-tertiary rounded-lg p-4 text-xs font-mono text-fg-muted overflow-x-auto">
{`query GetFindings($repoId: ID!, $severity: Severity) {
  findings(repositoryId: $repoId, severity: $severity) {
    id
    title
    severity
    status
    category
    filePath
    confidence
    suggestedFix
  }
}`}
              </pre>
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={() => copyToClipboard('query GetFindings')}>Copy Query</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Example Mutation</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-bg-tertiary rounded-lg p-4 text-xs font-mono text-fg-muted overflow-x-auto">
{`mutation ApproveFix($findingId: ID!) {
  approveFix(findingId: $findingId) {
    id
    status
    approvedAt
    approvedBy
  }
}`}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Register Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Webhook URL"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://your-app.com/webhooks/codepulse"
                />
                <div>
                  <div className="text-sm font-medium text-fg mb-2">Select Events</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {webhookEvents.map(event => (
                      <label key={event.event} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg cursor-pointer hover:bg-bg-hover transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event.event)}
                          onChange={() => toggleEvent(event.event)}
                          className="w-4 h-4 rounded border-border bg-bg-secondary text-accent focus:ring-accent"
                        />
                        <div>
                          <div className="text-sm font-mono text-fg">{event.event}</div>
                          <div className="text-xs text-fg-muted">{event.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <Button>Register Webhook</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Payloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {webhookEvents.slice(0, 4).map(event => (
                  <div key={event.event} className="bg-bg-tertiary rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono font-medium text-fg">{event.event}</span>
                      <Button size="xs" variant="ghost" onClick={() => copyToClipboard(event.payload)}>Copy</Button>
                    </div>
                    <pre className="text-xs font-mono text-fg-muted">{event.payload}</pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SDKs Tab */}
      {activeTab === 'sdks' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Official SDKs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sdks.map(sdk => (
                  <div key={sdk.language} className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center text-sm font-bold text-accent">
                        {sdk.language.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-fg">{sdk.language}</div>
                        <div className="text-xs text-fg-muted">{sdk.package} • {sdk.version}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-bg-secondary px-2 py-1 rounded font-mono text-fg-muted hidden md:block">{sdk.install}</code>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(sdk.install)}>Copy</Button>
                      <Button size="sm">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start (TypeScript)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-bg-tertiary rounded-lg p-4 text-xs font-mono text-fg-muted overflow-x-auto">
{`import { CodePulse } from '@codepulse/sdk';

const client = new CodePulse({
  apiKey: process.env.CODEPULSE_API_KEY,
});

// List all findings
const findings = await client.findings.list({
  severity: 'HIGH',
  status: 'OPEN',
});

// Approve a fix
await client.findings.approve('finding_123');

// Register a webhook
await client.webhooks.create({
  url: 'https://my-app.com/webhooks',
  events: ['finding.created', 'run.completed'],
});`}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default APIWebhooks;

import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';

interface MCPServer {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  toolCount: number;
  config: Record<string, string>;
}

interface MCPServerManagerProps {
  servers: MCPServer[];
  onAdd: (server: MCPServer) => void;
  onRemove: (id: string) => void;
  onTest: (id: string) => Promise<boolean>;
  onToggle: (id: string) => void;
}

export function MCPServerManager({ servers, onAdd, onRemove, onTest, onToggle }: MCPServerManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newServer, setNewServer] = useState({ name: '', command: '', args: '' });

  const statusColors = {
    connected: 'bg-green/20 text-green',
    disconnected: 'bg-gray/20 text-gray',
    error: 'bg-red/20 text-red',
  };

  const statusIcons = {
    connected: '🟢',
    disconnected: '⚪',
    error: '🔴',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-fg">MCP Servers</h3>
          <p className="text-sm text-fg-muted">Manage Model Context Protocol server connections</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Server'}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input label="Name" value={newServer.name} onChange={e => setNewServer(s => ({ ...s, name: e.target.value }))} placeholder="filesystem" />
              <Input label="Command" value={newServer.command} onChange={e => setNewServer(s => ({ ...s, command: e.target.value }))} placeholder="npx" />
              <Input label="Args" value={newServer.args} onChange={e => setNewServer(s => ({ ...s, args: e.target.value }))} placeholder="-y @modelcontextprotocol/server-filesystem" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => { onAdd({ ...newServer, id: crypto.randomUUID(), status: 'disconnected', toolCount: 0, config: {} }); setShowAdd(false); }}>Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {servers.map(server => (
          <Card key={server.id}>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{statusIcons[server.status]}</span>
                    <h4 className="text-sm font-medium text-fg">{server.name}</h4>
                    <span className={cn('px-2 py-0.5 text-xs rounded-full', statusColors[server.status])}>
                      {server.status}
                    </span>
                  </div>
                  <p className="text-xs text-fg-muted mt-1">{server.toolCount} tools available</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" onClick={() => onTest(server.id)}>Test</Button>
                  <Switch checked={server.status === 'connected'} onChange={() => onToggle(server.id)} label="" />
                  <Button variant="ghost" size="xs" onClick={() => onRemove(server.id)}>Remove</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface WebhookConfig {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  lastDelivery?: string;
  deliveryCount: number;
}

interface WebhookManagerProps {
  webhooks: WebhookConfig[];
  onAdd: (webhook: WebhookConfig) => void;
  onRemove: (id: string) => void;
  onRotateSecret: (id: string) => void;
  onTestDelivery: (id: string) => Promise<boolean>;
}

export function WebhookManager({ webhooks, onAdd, onRemove, onRotateSecret, onTestDelivery }: WebhookManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: '', secret: '', events: ['push', 'pull_request'] });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-fg">Webhooks</h3>
          <p className="text-sm text-fg-muted">Configure incoming webhook endpoints</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Webhook'}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="space-y-4">
            <Input label="Endpoint URL" value={newWebhook.url} onChange={e => setNewWebhook(w => ({ ...w, url: e.target.value }))} placeholder="https://api.example.com/webhooks/github" />
            <Input label="Secret" value={newWebhook.secret} onChange={e => setNewWebhook(w => ({ ...w, secret: e.target.value }))} placeholder="whsec_..." />
            <div>
              <label className="block text-sm text-fg-muted mb-2">Events</label>
              <div className="flex flex-wrap gap-2">
                {['push', 'pull_request', 'issues', 'check_run', 'deployment'].map(event => (
                  <label key={event} className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary rounded-lg cursor-pointer hover:bg-bg-hover transition-colors">
                    <input
                      type="checkbox"
                      checked={newWebhook.events.includes(event)}
                      onChange={e => {
                        if (e.target.checked) setNewWebhook(w => ({ ...w, events: [...w.events, event] }));
                        else setNewWebhook(w => ({ ...w, events: w.events.filter(ev => ev !== event) }));
                      }}
                      className="rounded border-border"
                    />
                    <span className="text-xs text-fg">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => { onAdd({ ...newWebhook, id: crypto.randomUUID(), active: true, deliveryCount: 0 }); setShowAdd(false); }}>Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {webhooks.map(webhook => (
          <Card key={webhook.id}>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-mono text-fg truncate max-w-md">{webhook.url}</h4>
                    <Badge variant={webhook.active ? 'success' : 'default'}>{webhook.active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-fg-muted">{webhook.events.length} events</span>
                    <span className="text-xs text-fg-muted">{webhook.deliveryCount} deliveries</span>
                    {webhook.lastDelivery && <span className="text-xs text-fg-muted">Last: {webhook.lastDelivery}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="xs" onClick={() => onTestDelivery(webhook.id)}>Test</Button>
                  <Button variant="outline" size="xs" onClick={() => onRotateSecret(webhook.id)}>Rotate Secret</Button>
                  <Button variant="ghost" size="xs" onClick={() => onRemove(webhook.id)}>Remove</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

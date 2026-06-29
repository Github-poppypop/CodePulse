import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';
import { Select, SelectOption } from '../ui/Select';

interface LLMProvider {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  apiKey: string;
  defaultModel: string;
  costPerToken: number;
}

interface LLMProviderManagerProps {
  providers: LLMProvider[];
  onUpdate: (id: string, updates: Partial<LLMProvider>) => void;
  onAdd: (provider: LLMProvider) => void;
  onRemove: (id: string) => void;
  onTest: (id: string) => Promise<boolean>;
}

export function LLMProviderManager({ providers, onUpdate, onAdd, onRemove, onTest }: LLMProviderManagerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState({ name: '', type: 'openrouter', apiKey: '', defaultModel: '' });

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      await onTest(id);
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-fg">LLM Providers</h3>
          <p className="text-sm text-fg-muted">Configure AI models for each task type</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : 'Add Provider'}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={newProvider.name} onChange={e => setNewProvider(p => ({ ...p, name: e.target.value }))} placeholder="My Provider" />
              <div>
                <label className="block text-sm text-fg-muted mb-1">Type</label>
                <select value={newProvider.type} onChange={e => setNewProvider(p => ({ ...p, type: e.target.value }))} className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-fg text-sm">
                  <option value="openrouter">OpenRouter</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="local">Local (Ollama)</option>
                </select>
              </div>
              <Input label="API Key" value={newProvider.apiKey} onChange={e => setNewProvider(p => ({ ...p, apiKey: e.target.value }))} placeholder="sk-..." type="password" />
              <Input label="Default Model" value={newProvider.defaultModel} onChange={e => setNewProvider(p => ({ ...p, defaultModel: e.target.value }))} placeholder="gpt-4" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => { onAdd({ ...newProvider, id: crypto.randomUUID(), enabled: true, costPerToken: 0 }); setShowAdd(false); }}>Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {providers.map(provider => (
          <Card key={provider.id}>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-fg">{provider.name}</h4>
                    <Badge variant={provider.enabled ? 'success' : 'default'}>{provider.enabled ? 'Active' : 'Disabled'}</Badge>
                  </div>
                  <p className="text-xs text-fg-muted mt-0.5">{provider.type} · {provider.defaultModel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={provider.enabled} onChange={() => onUpdate(provider.id, { enabled: !provider.enabled })} label="" />
                  <Button variant="outline" size="xs" onClick={() => handleTest(provider.id)} disabled={testing === provider.id}>
                    {testing === provider.id ? 'Testing...' : 'Test'}
                  </Button>
                  <Button variant="ghost" size="xs" onClick={() => onRemove(provider.id)}>Remove</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface AutonomyRule {
  id: string;
  name: string;
  condition: string;
  action: 'auto-fix' | 'require-approval' | 'skip';
  enabled: boolean;
}

interface AutonomyPolicyBuilderProps {
  rules: AutonomyRule[];
  onUpdate: (id: string, updates: Partial<AutonomyRule>) => void;
  onAdd: (rule: AutonomyRule) => void;
  onRemove: (id: string) => void;
  onDryRun: () => void;
}

export function AutonomyPolicyBuilder({ rules, onUpdate, onAdd, onRemove, onDryRun }: AutonomyPolicyBuilderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-fg">Autonomy Policy</h3>
          <p className="text-sm text-fg-muted">Define when CodePulse can auto-fix vs require approval</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDryRun}>Dry Run</Button>
          <Button variant="primary" size="sm" onClick={() => onAdd({ id: crypto.randomUUID(), name: 'New Rule', condition: 'severity == LOW', action: 'auto-fix', enabled: true })}>Add Rule</Button>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <Card key={rule.id}>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="text-xs text-fg-muted font-mono w-6">{index + 1}</span>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <Input value={rule.name} onChange={e => onUpdate(rule.id, { name: e.target.value })} placeholder="Rule name" />
                  <select value={rule.condition} onChange={e => onUpdate(rule.id, { condition: e.target.value })} className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-fg text-sm">
                    <option value="severity == LOW">Severity is LOW</option>
                    <option value="severity == MEDIUM">Severity is MEDIUM</option>
                    <option value="severity == HIGH">Severity is HIGH</option>
                    <option value="confidence >= 90">Confidence ≥ 90%</option>
                    <option value="category == BUG">Category is BUG</option>
                    <option value="category == SECURITY">Category is SECURITY</option>
                  </select>
                  <select value={rule.action} onChange={e => onUpdate(rule.id, { action: e.target.value as any })} className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-fg text-sm">
                    <option value="auto-fix">Auto-fix</option>
                    <option value="require-approval">Require Approval</option>
                    <option value="skip">Skip</option>
                  </select>
                </div>
                <Switch checked={rule.enabled} onChange={() => onUpdate(rule.id, { enabled: !rule.enabled })} label="" />
                <Button variant="ghost" size="xs" onClick={() => onRemove(rule.id)}>Remove</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

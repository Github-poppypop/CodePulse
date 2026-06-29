import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  costPer1k: number;
  speed: 'ultra-fast' | 'fast' | 'medium' | 'slow';
  intelligence: number;
  maxTokens: number;
  capabilities: string[];
}

interface RoutingRule {
  id: string;
  taskType: string;
  modelId: string;
  enabled: boolean;
  priority: number;
  conditions: { maxCost?: number; minConfidence?: number; maxLatency?: number };
}

interface RoutingMetric {
  taskType: string;
  modelUsed: string;
  avgLatency: number;
  avgCost: number;
  successRate: number;
  count: number;
}

const availableModels: ModelOption[] = [
  { id: 'm1', name: 'GPT-4o Mini', provider: 'OpenAI', costPer1k: 0.00015, speed: 'ultra-fast', intelligence: 3, maxTokens: 128000, capabilities: ['lint', 'style', 'simple-fix'] },
  { id: 'm2', name: 'Claude Haiku 3.5', provider: 'Anthropic', costPer1k: 0.0008, speed: 'ultra-fast', intelligence: 4, maxTokens: 200000, capabilities: ['lint', 'style', 'simple-fix', 'refactor'] },
  { id: 'm3', name: 'Claude Sonnet 4', provider: 'Anthropic', costPer1k: 0.003, speed: 'fast', intelligence: 7, maxTokens: 200000, capabilities: ['lint', 'style', 'fix', 'refactor', 'security', 'architecture'] },
  { id: 'm4', name: 'GPT-4o', provider: 'OpenAI', costPer1k: 0.005, speed: 'fast', intelligence: 8, maxTokens: 128000, capabilities: ['lint', 'style', 'fix', 'refactor', 'security', 'architecture'] },
  { id: 'm5', name: 'Claude Opus 4', provider: 'Anthropic', costPer1k: 0.015, speed: 'medium', intelligence: 9, maxTokens: 200000, capabilities: ['lint', 'style', 'fix', 'refactor', 'security', 'architecture', 'design'] },
  { id: 'm6', name: 'DeepSeek V3', provider: 'DeepSeek', costPer1k: 0.0007, speed: 'fast', intelligence: 7, maxTokens: 64000, capabilities: ['lint', 'style', 'fix', 'refactor', 'security'] },
];

const defaultRules: RoutingRule[] = [
  { id: 'r1', taskType: 'Lint & Style', modelId: 'm1', enabled: true, priority: 1, conditions: { maxCost: 0.0002, maxLatency: 500 } },
  { id: 'r2', taskType: 'Simple Fixes', modelId: 'm2', enabled: true, priority: 2, conditions: { maxCost: 0.001, maxLatency: 1000 } },
  { id: 'r3', taskType: 'Bug Fixes', modelId: 'm3', enabled: true, priority: 3, conditions: { maxCost: 0.005, maxLatency: 3000 } },
  { id: 'r4', taskType: 'Refactoring', modelId: 'm4', enabled: true, priority: 4, conditions: { maxCost: 0.008, maxLatency: 5000 } },
  { id: 'r5', taskType: 'Security Analysis', modelId: 'm5', enabled: true, priority: 5, conditions: { minConfidence: 0.95, maxLatency: 8000 } },
  { id: 'r6', taskType: 'Architecture', modelId: 'm5', enabled: true, priority: 6, conditions: { minConfidence: 0.9, maxLatency: 10000 } },
  { id: 'r7', taskType: 'Code Review', modelId: 'm3', enabled: true, priority: 7, conditions: { maxCost: 0.004, maxLatency: 4000 } },
];

const routingMetrics: RoutingMetric[] = [
  { taskType: 'Lint & Style', modelUsed: 'GPT-4o Mini', avgLatency: 230, avgCost: 0.00008, successRate: 0.98, count: 1240 },
  { taskType: 'Simple Fixes', modelUsed: 'Claude Haiku', avgLatency: 580, avgCost: 0.0004, successRate: 0.94, count: 890 },
  { taskType: 'Bug Fixes', modelUsed: 'Claude Sonnet 4', avgLatency: 2100, avgCost: 0.0021, successRate: 0.87, count: 456 },
  { taskType: 'Refactoring', modelUsed: 'GPT-4o', avgLatency: 3400, avgCost: 0.0038, successRate: 0.82, count: 234 },
  { taskType: 'Security Analysis', modelUsed: 'Claude Opus 4', avgLatency: 5200, avgCost: 0.0085, successRate: 0.91, count: 128 },
  { taskType: 'Architecture', modelUsed: 'Claude Opus 4', avgLatency: 7800, avgCost: 0.012, successRate: 0.78, count: 67 },
];

export function ModelRouter() {
  const [rules, setRules] = React.useState<RoutingRule[]>(defaultRules);
  const [routingEnabled, setRoutingEnabled] = React.useState(true);
  const [totalSavings, setTotalSavings] = React.useState(47.3);
  const [selectedRule, setSelectedRule] = React.useState<RoutingRule | null>(null);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const updateRuleModel = (ruleId: string, modelId: string) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, modelId } : r));
  };

  const getModelName = (modelId: string) => availableModels.find(m => m.id === modelId)?.name || 'Unknown';

  const getSpeedColor = (speed: string) => {
    switch (speed) {
      case 'ultra-fast': return 'text-green';
      case 'fast': return 'text-blue';
      case 'medium': return 'text-yellow';
      case 'slow': return 'text-red';
      default: return 'text-fg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Model Router</h2>
          <p className="text-sm text-fg-muted mt-1">Automatic model selection per task (cheap for lint, smart for architecture)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-fg-muted">Cost Savings</div>
            <div className="text-sm font-bold text-green">{totalSavings}%</div>
          </div>
          <Switch checked={routingEnabled} onChange={() => setRoutingEnabled(!routingEnabled)} label="Smart Routing" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Tasks Routed Today</div>
          <div className="text-2xl font-bold text-fg">{routingMetrics.reduce((sum, m) => sum + m.count, 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Active Models</div>
          <div className="text-2xl font-bold text-fg">{new Set(rules.filter(r => r.enabled).map(r => r.modelId)).size}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Avg Success Rate</div>
          <div className="text-2xl font-bold text-green">
            {(routingMetrics.reduce((sum, m) => sum + m.successRate, 0) / routingMetrics.length * 100).toFixed(1)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Cost Saved (30d)</div>
          <div className="text-2xl font-bold text-green">$1,247</div>
          <div className="text-xs text-fg-muted mt-1">vs using Opus for all</div>
        </Card>
      </div>

      {/* Routing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Routing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.sort((a, b) => a.priority - b.priority).map(rule => (
              <div
                key={rule.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-all',
                  rule.enabled ? 'bg-bg-tertiary border-border' : 'bg-bg-secondary border-border/50 opacity-60'
                )}
              >
                <Switch checked={rule.enabled} onChange={() => toggleRule(rule.id)} />
                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-xs font-bold text-accent">
                  {rule.priority}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-fg">{rule.taskType}</div>
                  <div className="text-xs text-fg-muted">
                    {rule.conditions.maxCost && `Max $${rule.conditions.maxCost}/1k tokens`}
                    {rule.conditions.maxLatency && ` • Max ${rule.conditions.maxLatency}ms`}
                    {rule.conditions.minConfidence && ` • Min ${(rule.conditions.minConfidence * 100).toFixed(0)}% confidence`}
                  </div>
                </div>
                <div className="w-48">
                  <Select
                    options={availableModels.map(m => ({ value: m.id, label: m.name }))}
                    value={rule.modelId}
                    onChange={e => updateRuleModel(rule.id, e.target.value)}
                  />
                </div>
                <Button size="xs" variant="ghost" onClick={() => setSelectedRule(rule)}>Edit</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Routing Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Routing Performance</CardTitle>
        </CardHeader>
        <CardContent padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Task Type</th>
                <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Model Used</th>
                <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Avg Latency</th>
                <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Avg Cost</th>
                <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Success Rate</th>
                <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Tasks</th>
              </tr>
            </thead>
            <tbody>
              {routingMetrics.map((metric, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-bg-hover">
                  <td className="py-3 px-4 text-sm font-medium text-fg">{metric.taskType}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" size="sm">{metric.modelUsed}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-fg">{metric.avgLatency}ms</td>
                  <td className="py-3 px-4 text-right text-xs text-fg">${metric.avgCost.toFixed(4)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn('text-xs font-medium', metric.successRate >= 0.9 ? 'text-green' : metric.successRate >= 0.8 ? 'text-yellow' : 'text-red')}>
                      {(metric.successRate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-xs text-fg-muted">{metric.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle>Available Models</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableModels.map(model => (
              <div key={model.id} className="p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-fg">{model.name}</span>
                  <span className={cn('text-[10px] font-medium', getSpeedColor(model.speed))}>{model.speed}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-fg-muted mb-2">
                  <span>{model.provider}</span>
                  <span>${model.costPer1k}/1k tokens</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[10px] text-fg-muted">Intelligence:</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={cn('w-1.5 h-3 rounded-sm', i < model.intelligence ? 'bg-accent' : 'bg-bg-secondary')} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.slice(0, 3).map(cap => (
                    <Badge key={cap} variant="outline" size="sm">{cap}</Badge>
                  ))}
                  {model.capabilities.length > 3 && (
                    <Badge variant="outline" size="sm">+{model.capabilities.length - 3}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rule Edit Modal */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedRule(null)}>
          <div className="bg-bg-secondary border border-border rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-fg mb-4">Edit Routing Rule</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Task Type</label>
                <input
                  type="text"
                  value={selectedRule.taskType}
                  readOnly
                  className="w-full rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                />
              </div>
              <Select
                label="Model"
                options={availableModels.map(m => ({ value: m.id, label: `${m.name} (${m.provider})` }))}
                value={selectedRule.modelId}
                onChange={e => { updateRuleModel(selectedRule.id, e.target.value); setSelectedRule({ ...selectedRule, modelId: e.target.value }); }}
              />
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Max Cost ($/1k tokens)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={selectedRule.conditions.maxCost || ''}
                  onChange={e => setSelectedRule({ ...selectedRule, conditions: { ...selectedRule.conditions, maxCost: parseFloat(e.target.value) } })}
                  className="w-full rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fg mb-1.5">Max Latency (ms)</label>
                <input
                  type="number"
                  value={selectedRule.conditions.maxLatency || ''}
                  onChange={e => setSelectedRule({ ...selectedRule, conditions: { ...selectedRule.conditions, maxLatency: parseInt(e.target.value) } })}
                  className="w-full rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedRule(null)}>Cancel</Button>
                <Button className="flex-1" onClick={() => { setRules(rules.map(r => r.id === selectedRule.id ? selectedRule : r)); setSelectedRule(null); }}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelRouter;

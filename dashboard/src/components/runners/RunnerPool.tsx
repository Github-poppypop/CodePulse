import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

interface Runner {
  id: string;
  name: string;
  type: 'kubernetes' | 'ecs' | 'spot' | 'on-demand';
  status: 'running' | 'idle' | 'scaling' | 'terminated';
  region: string;
  cpu: number;
  memory: number;
  tasksRunning: number;
  tasksCompleted: number;
  uptime: string;
  cost: number;
}

interface ScalingPolicy {
  minInstances: number;
  maxInstances: number;
  currentInstances: number;
  targetCpuUtilization: number;
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownSeconds: number;
}

interface RunnerFleet {
  id: string;
  name: string;
  provider: 'kubernetes' | 'ecs';
  region: string;
  runners: Runner[];
  scaling: ScalingPolicy;
  spotPercentage: number;
  monthlyCost: number;
}

const mockFleets: RunnerFleet[] = [
  {
    id: 'fleet1',
    name: 'Primary K8s Fleet',
    provider: 'kubernetes',
    region: 'us-east-1',
    spotPercentage: 60,
    monthlyCost: 4520,
    scaling: { minInstances: 2, maxInstances: 20, currentInstances: 8, targetCpuUtilization: 70, scaleUpThreshold: 80, scaleDownThreshold: 30, cooldownSeconds: 120 },
    runners: [
      { id: 'r1', name: 'k8s-runner-0', type: 'kubernetes', status: 'running', region: 'us-east-1a', cpu: 4, memory: 16, tasksRunning: 3, tasksCompleted: 142, uptime: '2d 4h', cost: 12.50 },
      { id: 'r2', name: 'k8s-runner-1', type: 'kubernetes', status: 'running', region: 'us-east-1b', cpu: 4, memory: 16, tasksRunning: 2, tasksCompleted: 128, uptime: '2d 4h', cost: 12.50 },
      { id: 'r3', name: 'k8s-spot-0', type: 'spot', status: 'running', region: 'us-east-1a', cpu: 8, memory: 32, tasksRunning: 5, tasksCompleted: 89, uptime: '6h 22m', cost: 8.40 },
      { id: 'r4', name: 'k8s-spot-1', type: 'spot', status: 'running', region: 'us-east-1c', cpu: 8, memory: 32, tasksRunning: 4, tasksCompleted: 76, uptime: '6h 22m', cost: 8.40 },
      { id: 'r5', name: 'k8s-spot-2', type: 'spot', status: 'idle', region: 'us-east-1b', cpu: 8, memory: 32, tasksRunning: 0, tasksCompleted: 45, uptime: '1h 15m', cost: 4.20 },
      { id: 'r6', name: 'k8s-ondemand-0', type: 'on-demand', status: 'running', region: 'us-east-1a', cpu: 4, memory: 16, tasksRunning: 2, tasksCompleted: 201, uptime: '5d 12h', cost: 28.00 },
    ],
  },
  {
    id: 'fleet2',
    name: 'ECS Burst Fleet',
    provider: 'ecs',
    region: 'eu-west-1',
    spotPercentage: 80,
    monthlyCost: 1870,
    scaling: { minInstances: 0, maxInstances: 50, currentInstances: 4, targetCpuUtilization: 65, scaleUpThreshold: 75, scaleDownThreshold: 25, cooldownSeconds: 90 },
    runners: [
      { id: 'r7', name: 'ecs-spot-0', type: 'spot', status: 'scaling', region: 'eu-west-1a', cpu: 16, memory: 64, tasksRunning: 8, tasksCompleted: 56, uptime: '45m', cost: 12.80 },
      { id: 'r8', name: 'ecs-spot-1', type: 'spot', status: 'running', region: 'eu-west-1b', cpu: 16, memory: 64, tasksRunning: 6, tasksCompleted: 34, uptime: '2h 10m', cost: 12.80 },
      { id: 'r9', name: 'ecs-spot-2', type: 'spot', status: 'running', region: 'eu-west-1a', cpu: 16, memory: 64, tasksRunning: 7, tasksCompleted: 41, uptime: '2h 10m', cost: 12.80 },
      { id: 'r10', name: 'ecs-ondemand-0', type: 'on-demand', status: 'idle', region: 'eu-west-1b', cpu: 8, memory: 32, tasksRunning: 0, tasksCompleted: 12, uptime: '12m', cost: 14.00 },
    ],
  },
];

export function RunnerPool() {
  const [fleets, setFleets] = React.useState<RunnerFleet[]>(mockFleets);
  const [selectedFleet, setSelectedFleet] = React.useState<RunnerFleet>(mockFleets[0]);
  const [autoScaling, setAutoScaling] = React.useState(true);
  const [spotEnabled, setSpotEnabled] = React.useState(true);

  const totalRunners = fleets.reduce((sum, f) => sum + f.runners.length, 0);
  const activeRunners = fleets.reduce((sum, f) => sum + f.runners.filter(r => r.status === 'running').length, 0);
  const totalTasksRunning = fleets.reduce((sum, f) => sum + f.runners.reduce((s, r) => s + r.tasksRunning, 0), 0);
  const totalCost = fleets.reduce((sum, f) => sum + f.monthlyCost, 0);

  const getStatusColor = (status: Runner['status']) => {
    switch (status) {
      case 'running': return 'bg-green';
      case 'idle': return 'bg-yellow';
      case 'scaling': return 'bg-blue animate-pulse';
      case 'terminated': return 'bg-red';
    }
  };

  const getTypeBadge = (type: Runner['type']) => {
    switch (type) {
      case 'kubernetes': return <Badge variant="info" size="sm">K8s</Badge>;
      case 'ecs': return <Badge variant="warning" size="sm">ECS</Badge>;
      case 'spot': return <Badge variant="success" size="sm">Spot</Badge>;
      case 'on-demand': return <Badge variant="outline" size="sm">On-Demand</Badge>;
    }
  };

  const scaleUp = () => {
    setFleets(fleets.map(f => {
      if (f.id !== selectedFleet.id) return f;
      if (f.scaling.currentInstances >= f.scaling.maxInstances) return f;
      const updatedFleet = { ...f, scaling: { ...f.scaling, currentInstances: f.scaling.currentInstances + 1 } };
      setSelectedFleet(updatedFleet);
      return updatedFleet;
    }));
  };

  const scaleDown = () => {
    setFleets(fleets.map(f => {
      if (f.id !== selectedFleet.id) return f;
      if (f.scaling.currentInstances <= f.scaling.minInstances) return f;
      const updatedFleet = { ...f, scaling: { ...f.scaling, currentInstances: f.scaling.currentInstances - 1 } };
      setSelectedFleet(updatedFleet);
      return updatedFleet;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Runner Pool</h2>
          <p className="text-sm text-fg-muted mt-1">Kubernetes/ECS runner fleet, auto-scaling, spot instances</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">+ Add Fleet</Button>
          <Button size="sm">+ Deploy Runner</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Total Runners</div>
          <div className="text-2xl font-bold text-fg">{totalRunners}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Active</div>
          <div className="text-2xl font-bold text-green">{activeRunners}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Tasks Running</div>
          <div className="text-2xl font-bold text-blue">{totalTasksRunning}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Spot Savings</div>
          <div className="text-2xl font-bold text-green">62%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Monthly Cost</div>
          <div className="text-2xl font-bold text-fg">${totalCost.toLocaleString()}</div>
        </Card>
      </div>

      {/* Fleet Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg w-fit">
        {fleets.map(fleet => (
          <button
            key={fleet.id}
            onClick={() => setSelectedFleet(fleet)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              selectedFleet.id === fleet.id ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
            )}
          >
            {fleet.name}
          </button>
        ))}
      </div>

      {/* Fleet Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Scaling Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-fg">Auto-Scaling</div>
                  <div className="text-xs text-fg-muted">Automatically adjust runner count</div>
                </div>
                <Switch checked={autoScaling} onChange={() => setAutoScaling(!autoScaling)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-fg">Spot Instances</div>
                  <div className="text-xs text-fg-muted">{selectedFleet.spotPercentage}% spot, {100 - selectedFleet.spotPercentage}% on-demand</div>
                </div>
                <Switch checked={spotEnabled} onChange={() => setSpotEnabled(!spotEnabled)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-fg-muted mb-1">Min Instances</label>
                  <input
                    type="number"
                    value={selectedFleet.scaling.minInstances}
                    className="w-full rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-xs text-fg-muted mb-1">Max Instances</label>
                  <input
                    type="number"
                    value={selectedFleet.scaling.maxInstances}
                    className="w-full rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                    readOnly
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-fg-muted mb-1">Target CPU: {selectedFleet.scaling.targetCpuUtilization}%</label>
                <input
                  type="range"
                  min="40"
                  max="90"
                  value={selectedFleet.scaling.targetCpuUtilization}
                  className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
                  readOnly
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <span className="text-sm text-fg">Current: {selectedFleet.scaling.currentInstances} instances</span>
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" onClick={scaleDown}>−</Button>
                  <Button size="xs" variant="ghost" onClick={scaleUp}>+</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Spot Instances', cost: selectedFleet.monthlyCost * (selectedFleet.spotPercentage / 100), color: 'bg-green' },
                { label: 'On-Demand', cost: selectedFleet.monthlyCost * ((100 - selectedFleet.spotPercentage) / 100), color: 'bg-blue' },
                { label: 'Network/Storage', cost: selectedFleet.monthlyCost * 0.08, color: 'bg-purple' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded', item.color)} />
                    <span className="text-sm text-fg">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-fg">${item.cost.toFixed(0)}/mo</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-fg">Total</span>
                <span className="text-sm font-bold text-fg">${(selectedFleet.monthlyCost * 1.08).toFixed(0)}/mo</span>
              </div>
              <div className="bg-green/10 border border-green/30 rounded-lg p-2 mt-3">
                <div className="text-xs text-green">
                  💰 Spot instances saving ~${(selectedFleet.monthlyCost * (selectedFleet.spotPercentage / 100) * 0.65).toFixed(0)}/mo vs all on-demand
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Runners Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Runners ({selectedFleet.runners.length})</CardTitle>
          <Select
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'spot', label: 'Spot Only' },
              { value: 'on-demand', label: 'On-Demand Only' },
            ]}
            defaultValue="all"
          />
        </CardHeader>
        <CardContent padding="none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Runner</th>
                <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Type</th>
                <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Status</th>
                <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Region</th>
                <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Resources</th>
                <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Tasks</th>
                <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Uptime</th>
                <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {selectedFleet.runners.map(runner => (
                <tr key={runner.id} className="border-b border-border/50 hover:bg-bg-hover">
                  <td className="py-3 px-4">
                    <div className="text-sm font-medium font-mono text-fg">{runner.name}</div>
                  </td>
                  <td className="py-3 px-4">{getTypeBadge(runner.type)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', getStatusColor(runner.status))} />
                      <span className="text-xs text-fg capitalize">{runner.status}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-fg-muted">{runner.region}</td>
                  <td className="py-3 px-4 text-xs text-fg-muted text-right">{runner.cpu}vCPU / {runner.memory}GB</td>
                  <td className="py-3 px-4 text-xs text-fg text-right">
                    <span className="text-blue">{runner.tasksRunning}</span> / {runner.tasksCompleted}
                  </td>
                  <td className="py-3 px-4 text-xs text-fg-muted text-right">{runner.uptime}</td>
                  <td className="py-3 px-4 text-xs text-fg text-right">${runner.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Scaling Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Scaling History (Last 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-0.5 h-24">
            {Array.from({ length: 24 }).map((_, i) => {
              const hour = new Date();
              hour.setHours(hour.getHours() - 23 + i);
              const value = 3 + Math.sin(i * 0.7) * 3 + Math.random() * 2;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-accent/50 rounded-t hover:bg-accent transition-colors"
                    style={{ height: `${(value / selectedFleet.scaling.maxInstances) * 100}%` }}
                    title={`-${23 - i}h: ${Math.round(value)} instances`}
                  />
                  {i % 4 === 0 && (
                    <span className="text-[8px] text-fg-muted">{hour.getHours()}:00</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RunnerPool;

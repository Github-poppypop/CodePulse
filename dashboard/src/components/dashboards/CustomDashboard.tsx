import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

interface Widget {
  id: string;
  type: 'stats' | 'chart' | 'table' | 'activity' | 'findings' | 'runs';
  title: string;
  size: 'sm' | 'md' | 'lg' | 'full';
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

interface SavedView {
  id: string;
  name: string;
  widgets: Widget[];
  createdAt: string;
  shared: boolean;
  shareLink?: string;
}

interface CustomDashboardProps {
  initialWidgets?: Widget[];
}

const defaultWidgets: Widget[] = [
  { id: 'w1', type: 'stats', title: 'Overview Stats', size: 'full', position: { x: 0, y: 0 }, config: {} },
  { id: 'w2', type: 'chart', title: 'Findings Trend', size: 'md', position: { x: 0, y: 1 }, config: {} },
  { id: 'w3', type: 'chart', title: 'Fix Rate', size: 'md', position: { x: 1, y: 1 }, config: {} },
  { id: 'w4', type: 'table', title: 'Recent Findings', size: 'lg', position: { x: 0, y: 2 }, config: {} },
  { id: 'w5', type: 'activity', title: 'Activity Feed', size: 'sm', position: { x: 1, y: 2 }, config: {} },
  { id: 'w6', type: 'runs', title: 'Recent Runs', size: 'full', position: { x: 0, y: 3 }, config: {} },
];

const savedViews: SavedView[] = [
  { id: 'sv1', name: 'Executive Overview', widgets: defaultWidgets, createdAt: '2026-06-25T10:00:00Z', shared: true, shareLink: 'https://codepulse.io/share/dash_abc123' },
  { id: 'sv2', name: 'Security Focus', widgets: defaultWidgets.slice(0, 4), createdAt: '2026-06-26T14:00:00Z', shared: false },
  { id: 'sv3', name: 'Team Performance', widgets: defaultWidgets.slice(2, 6), createdAt: '2026-06-27T09:00:00Z', shared: true, shareLink: 'https://codepulse.io/share/dash_def456' },
];

const widgetTypes = [
  { value: 'stats', label: 'Statistics Cards' },
  { value: 'chart', label: 'Chart Widget' },
  { value: 'table', label: 'Data Table' },
  { value: 'activity', label: 'Activity Feed' },
  { value: 'findings', label: 'Findings List' },
  { value: 'runs', label: 'Runs Timeline' },
];

function StatsWidget() {
  const stats = [
    { label: 'Total Repos', value: '24', change: '+3', positive: true },
    { label: 'Open Findings', value: '142', change: '-12', positive: true },
    { label: 'Fix Rate', value: '87%', change: '+5%', positive: true },
    { label: 'Avg Run Time', value: '4.2m', change: '-0.8m', positive: true },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div key={stat.label} className="bg-bg-tertiary rounded-lg p-4">
          <div className="text-xs text-fg-muted">{stat.label}</div>
          <div className="text-xl font-bold text-fg mt-1">{stat.value}</div>
          <div className={cn('text-xs mt-1', stat.positive ? 'text-green' : 'text-red')}>{stat.change}</div>
        </div>
      ))}
    </div>
  );
}

function ChartWidget({ title }: { title: string }) {
  const data = [35, 52, 48, 65, 42, 78, 55, 62, 70, 45, 58, 72];
  const max = Math.max(...data);
  return (
    <div>
      <h4 className="text-sm font-medium text-fg mb-3">{title}</h4>
      <div className="flex items-end gap-1 h-32">
        {data.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-accent/60 rounded-t hover:bg-accent transition-colors"
              style={{ height: `${(val / max) * 100}%` }}
            />
            <span className="text-[9px] text-fg-muted">{i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableWidget() {
  const findings = [
    { id: '1', title: 'SQL Injection in search', severity: 'CRITICAL', status: 'OPEN' },
    { id: '2', title: 'Null pointer in auth', severity: 'HIGH', status: 'FIXED' },
    { id: '3', title: 'N+1 query in users', severity: 'MEDIUM', status: 'OPEN' },
    { id: '4', title: 'Missing type annotation', severity: 'LOW', status: 'IN_PROGRESS' },
    { id: '5', title: 'Duplicate validation logic', severity: 'LOW', status: 'OPEN' },
  ];
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-3 text-xs text-fg-muted font-medium">Finding</th>
            <th className="text-left py-2 px-3 text-xs text-fg-muted font-medium">Severity</th>
            <th className="text-left py-2 px-3 text-xs text-fg-muted font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {findings.map(f => (
            <tr key={f.id} className="border-b border-border/50 hover:bg-bg-hover">
              <td className="py-2 px-3 text-fg">{f.title}</td>
              <td className="py-2 px-3">
                <Badge variant={f.severity === 'CRITICAL' ? 'error' : f.severity === 'HIGH' ? 'warning' : f.severity === 'MEDIUM' ? 'info' : 'default'} size="sm">
                  {f.severity}
                </Badge>
              </td>
              <td className="py-2 px-3">
                <Badge variant={f.status === 'FIXED' ? 'success' : f.status === 'IN_PROGRESS' ? 'info' : 'outline'} size="sm">
                  {f.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityWidget() {
  const activities = [
    { user: 'Alice', action: 'approved fix for', target: 'SQL Injection', time: '2m ago' },
    { user: 'Bob', action: 'commented on', target: 'Null pointer issue', time: '15m ago' },
    { user: 'System', action: 'auto-approved', target: 'Type annotation fix', time: '1h ago' },
    { user: 'Carol', action: 'rejected fix for', target: 'N+1 query', time: '2h ago' },
  ];
  return (
    <div className="space-y-3">
      {activities.map((a, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-fg">
              <span className="font-medium">{a.user}</span> {a.action} <span className="text-accent">{a.target}</span>
            </p>
            <span className="text-[10px] text-fg-muted">{a.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function RunsWidget() {
  const runs = [
    { id: 'r1', repo: 'frontend-app', status: 'COMPLETED', findings: 12, time: '3.2m' },
    { id: 'r2', repo: 'api-service', status: 'COMPLETED', findings: 8, time: '5.1m' },
    { id: 'r3', repo: 'auth-module', status: 'RUNNING', findings: 0, time: '1.4m' },
    { id: 'r4', repo: 'data-pipeline', status: 'FAILED', findings: 0, time: '0.8m' },
  ];
  return (
    <div className="space-y-2">
      {runs.map(r => (
        <div key={r.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
          <div className="flex items-center gap-3">
            <div className={cn('w-2 h-2 rounded-full', r.status === 'COMPLETED' ? 'bg-green' : r.status === 'RUNNING' ? 'bg-blue animate-pulse' : 'bg-red')} />
            <span className="text-sm text-fg font-medium">{r.repo}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-fg-muted">{r.findings} findings</span>
            <span className="text-xs text-fg-muted">{r.time}</span>
            <Badge variant={r.status === 'COMPLETED' ? 'success' : r.status === 'RUNNING' ? 'info' : 'error'} size="sm">
              {r.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.type) {
    case 'stats': return <StatsWidget />;
    case 'chart': return <ChartWidget title={widget.title} />;
    case 'table': return <TableWidget />;
    case 'activity': return <ActivityWidget />;
    case 'runs': return <RunsWidget />;
    default: return <div className="text-fg-muted text-sm">Unknown widget type</div>;
  }
}

export function CustomDashboard({ initialWidgets = defaultWidgets }: CustomDashboardProps) {
  const [widgets, setWidgets] = React.useState<Widget[]>(initialWidgets);
  const [views, setViews] = React.useState<SavedView[]>(savedViews);
  const [showAddWidget, setShowAddWidget] = React.useState(false);
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [showSaveView, setShowSaveView] = React.useState(false);
  const [newWidgetType, setNewWidgetType] = React.useState('stats');
  const [newWidgetTitle, setNewWidgetTitle] = React.useState('');
  const [viewName, setViewName] = React.useState('');
  const [draggedWidget, setDraggedWidget] = React.useState<string | null>(null);
  const [shareLink, setShareLink] = React.useState('');

  const addWidget = () => {
    const newWidget: Widget = {
      id: `w${Date.now()}`,
      type: newWidgetType as Widget['type'],
      title: newWidgetTitle || 'New Widget',
      size: 'md',
      position: { x: 0, y: widgets.length },
      config: {},
    };
    setWidgets([...widgets, newWidget]);
    setShowAddWidget(false);
    setNewWidgetTitle('');
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const saveView = () => {
    const newView: SavedView = {
      id: `sv${Date.now()}`,
      name: viewName || 'Untitled View',
      widgets: [...widgets],
      createdAt: new Date().toISOString(),
      shared: false,
    };
    setViews([newView, ...views]);
    setShowSaveView(false);
    setViewName('');
  };

  const shareView = (viewId: string) => {
    const link = `https://codepulse.io/share/dash_${Math.random().toString(36).slice(2, 10)}`;
    setShareLink(link);
    setViews(views.map(v => v.id === viewId ? { ...v, shared: true, shareLink: link } : v));
  };

  const getSizeClass = (size: Widget['size']) => {
    switch (size) {
      case 'sm': return 'col-span-1';
      case 'md': return 'col-span-1';
      case 'lg': return 'col-span-1 md:col-span-2';
      case 'full': return 'col-span-1 md:col-span-2';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Custom Dashboard</h2>
          <p className="text-sm text-fg-muted mt-1">Drag and drop widgets to build your perfect view</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSaveView(true)}>Save View</Button>
          <Button variant="outline" size="sm" onClick={() => setShowShareModal(true)}>Share</Button>
          <Button size="sm" onClick={() => setShowAddWidget(true)}>+ Add Widget</Button>
        </div>
      </div>

      {/* Saved Views */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {views.map(view => (
          <button
            key={view.id}
            className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border rounded-lg hover:border-accent transition-colors shrink-0"
            onClick={() => setWidgets(view.widgets)}
          >
            <span className="text-sm text-fg">{view.name}</span>
            {view.shared && <Badge variant="success" size="sm">Shared</Badge>}
          </button>
        ))}
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.map(widget => (
          <Card
            key={widget.id}
            className={cn(getSizeClass(widget.size), 'group relative')}
            draggable
            onDragStart={() => setDraggedWidget(widget.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (draggedWidget && draggedWidget !== widget.id) {
                const dragIdx = widgets.findIndex(w => w.id === draggedWidget);
                const dropIdx = widgets.findIndex(w => w.id === widget.id);
                const newWidgets = [...widgets];
                const [moved] = newWidgets.splice(dragIdx, 1);
                newWidgets.splice(dropIdx, 0, moved);
                setWidgets(newWidgets);
              }
              setDraggedWidget(null);
            }}
          >
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm">{widget.title}</CardTitle>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-fg-muted hover:text-red rounded"
                  title="Remove widget"
                >
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 5l-10 10M5 5l10 10" />
                  </svg>
                </button>
                <span className="p-1 text-fg-muted cursor-grab" title="Drag to reorder">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                    <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
                  </svg>
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <WidgetRenderer widget={widget} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowAddWidget(false)}>
          <div className="bg-bg-secondary border border-border rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-fg mb-4">Add Widget</h3>
            <div className="space-y-4">
              <Input label="Widget Title" value={newWidgetTitle} onChange={e => setNewWidgetTitle(e.target.value)} placeholder="Enter widget title..." />
              <Select
                label="Widget Type"
                options={widgetTypes}
                value={newWidgetType}
                onChange={e => setNewWidgetType(e.target.value)}
              />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddWidget(false)}>Cancel</Button>
                <Button className="flex-1" onClick={addWidget}>Add Widget</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save View Modal */}
      {showSaveView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowSaveView(false)}>
          <div className="bg-bg-secondary border border-border rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-fg mb-4">Save Dashboard View</h3>
            <div className="space-y-4">
              <Input label="View Name" value={viewName} onChange={e => setViewName(e.target.value)} placeholder="e.g., Executive Overview" />
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowSaveView(false)}>Cancel</Button>
                <Button className="flex-1" onClick={saveView}>Save View</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowShareModal(false)}>
          <div className="bg-bg-secondary border border-border rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-fg mb-4">Share Dashboard</h3>
            <div className="space-y-4">
              <div className="text-sm text-fg-muted">Share your saved views with your team or generate a public link.</div>
              <div className="space-y-2">
                {views.map(view => (
                  <div key={view.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-fg">{view.name}</div>
                      <div className="text-xs text-fg-muted">{view.widgets.length} widgets</div>
                    </div>
                    <div>
                      {view.shared ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green font-mono truncate max-w-[180px]">{view.shareLink}</span>
                          <Button size="xs" variant="ghost" onClick={() => navigator.clipboard?.writeText(view.shareLink || '')}>Copy</Button>
                        </div>
                      ) : (
                        <Button size="xs" onClick={() => shareView(view.id)}>Generate Link</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {shareLink && (
                <div className="p-3 bg-green/10 border border-green/30 rounded-lg">
                  <div className="text-xs text-green font-medium mb-1">Share link generated!</div>
                  <div className="text-sm text-fg font-mono break-all">{shareLink}</div>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setShowShareModal(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomDashboard;

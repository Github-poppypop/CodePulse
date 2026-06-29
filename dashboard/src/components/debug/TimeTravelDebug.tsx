import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

interface RunSnapshot {
  id: string;
  timestamp: string;
  state: Record<string, unknown>;
  action: string;
  duration: number;
  tokensUsed: number;
  modelUsed: string;
}

interface ReplayRun {
  id: string;
  repoName: string;
  startedAt: string;
  completedAt: string;
  status: 'COMPLETED' | 'FAILED' | 'RUNNING';
  totalSteps: number;
  modelUsed: string;
  totalTokens: number;
  snapshots: RunSnapshot[];
}

const mockRuns: ReplayRun[] = [
  {
    id: 'run_789',
    repoName: 'frontend-app',
    startedAt: '2026-06-28T10:00:00Z',
    completedAt: '2026-06-28T10:03:24Z',
    status: 'COMPLETED',
    totalSteps: 8,
    modelUsed: 'claude-sonnet-4',
    totalTokens: 45230,
    snapshots: [
      { id: 's1', timestamp: '2026-06-28T10:00:00Z', state: { phase: 'init', filesScanned: 0 }, action: 'Initialize analysis', duration: 120, tokensUsed: 0, modelUsed: 'system' },
      { id: 's2', timestamp: '2026-06-28T10:00:01Z', state: { phase: 'scan', filesScanned: 156, currentFile: 'src/index.ts' }, action: 'Scan repository structure', duration: 45000, tokensUsed: 2400, modelUsed: 'system' },
      { id: 's3', timestamp: '2026-06-28T10:00:46Z', state: { phase: 'analyze', currentFile: 'src/auth/service.ts', findings: [] }, action: 'Analyze auth/service.ts', duration: 32000, tokensUsed: 8400, modelUsed: 'claude-sonnet-4' },
      { id: 's4', timestamp: '2026-06-28T10:01:18Z', state: { phase: 'analyze', currentFile: 'src/auth/service.ts', findings: [{ type: 'null_pointer', line: 45 }] }, action: 'Detect null pointer issue', duration: 15000, tokensUsed: 3200, modelUsed: 'claude-sonnet-4' },
      { id: 's5', timestamp: '2026-06-28T10:01:33Z', state: { phase: 'analyze', currentFile: 'src/api/search.ts', findings: [] }, action: 'Analyze api/search.ts', duration: 28000, tokensUsed: 7800, modelUsed: 'claude-sonnet-4' },
      { id: 's6', timestamp: '2026-06-28T10:02:01Z', state: { phase: 'analyze', currentFile: 'src/api/search.ts', findings: [{ type: 'sql_injection', line: 112 }] }, action: 'Detect SQL injection vulnerability', duration: 18000, tokensUsed: 4100, modelUsed: 'claude-sonnet-4' },
      { id: 's7', timestamp: '2026-06-28T10:02:19Z', state: { phase: 'fix', currentFile: 'src/api/search.ts', fixAttempt: 1 }, action: 'Generate fix for SQL injection', duration: 45000, tokensUsed: 12400, modelUsed: 'claude-sonnet-4' },
      { id: 's8', timestamp: '2026-06-28T10:03:04Z', state: { phase: 'complete', totalFindings: 12, fixesGenerated: 8 }, action: 'Complete analysis run', duration: 20000, tokensUsed: 6930, modelUsed: 'claude-sonnet-4' },
    ],
  },
  {
    id: 'run_788',
    repoName: 'api-service',
    startedAt: '2026-06-28T09:00:00Z',
    completedAt: '2026-06-28T09:05:12Z',
    status: 'COMPLETED',
    totalSteps: 6,
    modelUsed: 'gpt-4o',
    totalTokens: 62100,
    snapshots: [
      { id: 's1', timestamp: '2026-06-28T09:00:00Z', state: { phase: 'init' }, action: 'Initialize analysis', duration: 100, tokensUsed: 0, modelUsed: 'system' },
      { id: 's2', timestamp: '2026-06-28T09:00:01Z', state: { phase: 'scan', filesScanned: 234 }, action: 'Scan repository structure', duration: 52000, tokensUsed: 3100, modelUsed: 'system' },
      { id: 's3', timestamp: '2026-06-28T09:00:53Z', state: { phase: 'analyze', currentFile: 'src/controllers/user.ts' }, action: 'Analyze user controller', duration: 45000, tokensUsed: 12500, modelUsed: 'gpt-4o' },
      { id: 's4', timestamp: '2026-06-28T09:01:38Z', state: { phase: 'analyze', currentFile: 'src/models/user.ts' }, action: 'Analyze user model', duration: 38000, tokensUsed: 9800, modelUsed: 'gpt-4o' },
      { id: 's5', timestamp: '2026-06-28T09:02:16Z', state: { phase: 'fix', fixesGenerated: 5 }, action: 'Generate fixes', duration: 120000, tokensUsed: 28500, modelUsed: 'gpt-4o' },
      { id: 's6', timestamp: '2026-06-28T09:04:16Z', state: { phase: 'complete', totalFindings: 8 }, action: 'Complete analysis', duration: 56000, tokensUsed: 8200, modelUsed: 'gpt-4o' },
    ],
  },
];

const phaseColors: Record<string, string> = {
  init: 'bg-fg-muted',
  scan: 'bg-blue',
  analyze: 'bg-purple',
  fix: 'bg-yellow',
  complete: 'bg-green',
};

export function TimeTravelDebug() {
  const [selectedRun, setSelectedRun] = React.useState<ReplayRun | null>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playbackSpeed, setPlaybackSpeed] = React.useState(1);
  const [viewMode, setViewMode] = React.useState<'timeline' | 'detail'>('timeline');

  const currentSnapshot = selectedRun?.snapshots[currentStep];

  React.useEffect(() => {
    if (!isPlaying || !selectedRun) return;
    if (currentStep >= selectedRun.snapshots.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 1000 / playbackSpeed);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, selectedRun, playbackSpeed]);

  const stepForward = () => {
    if (selectedRun && currentStep < selectedRun.snapshots.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const stepBackward = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const jumpToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Time Travel Debug</h2>
          <p className="text-sm text-fg-muted mt-1">Replay any run with full state, step through LLM reasoning</p>
        </div>
        <Badge variant="info">Debug Mode</Badge>
      </div>

      {/* Run Selection */}
      {!selectedRun ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-fg">Select a run to replay</h3>
          {mockRuns.map(run => (
            <Card key={run.id} hover className="cursor-pointer" onClick={() => { setSelectedRun(run); setCurrentStep(0); }}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      run.status === 'COMPLETED' ? 'bg-green' : run.status === 'FAILED' ? 'bg-red' : 'bg-blue animate-pulse'
                    )} />
                    <div>
                      <div className="text-sm font-medium text-fg">{run.repoName}</div>
                      <div className="text-xs text-fg-muted">{run.id} • {run.totalSteps} steps • {run.modelUsed}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-fg-muted">
                    <span>{new Date(run.startedAt).toLocaleString()}</span>
                    <span>{(run.totalTokens / 1000).toFixed(1)}k tokens</span>
                    <Button size="xs">Replay</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Playback Controls */}
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-fg">{selectedRun.repoName}</h3>
                  <Badge variant="outline">{selectedRun.modelUsed}</Badge>
                  <span className="text-xs text-fg-muted">{selectedRun.totalTokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="xs" variant="ghost" onClick={() => { setSelectedRun(null); setCurrentStep(0); setIsPlaying(false); }}>
                    ← Back
                  </Button>
                  <Select
                    options={[
                      { value: '0.5', label: '0.5x' },
                      { value: '1', label: '1x' },
                      { value: '2', label: '2x' },
                      { value: '4', label: '4x' },
                    ]}
                    value={String(playbackSpeed)}
                    onChange={e => setPlaybackSpeed(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="relative mb-4">
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / selectedRun.snapshots.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  {selectedRun.snapshots.map((snapshot, i) => (
                    <button
                      key={snapshot.id}
                      className={cn(
                        'w-3 h-3 rounded-full transition-all',
                        i <= currentStep ? phaseColors[snapshot.state.phase as string] || 'bg-accent' : 'bg-bg-tertiary',
                        i === currentStep && 'ring-2 ring-accent ring-offset-2 ring-offset-bg-secondary'
                      )}
                      onClick={() => jumpToStep(i)}
                      title={snapshot.action}
                    />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => jumpToStep(0)}>⏮</Button>
                <Button size="sm" variant="ghost" onClick={stepBackward}>◀</Button>
                <Button size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </Button>
                <Button size="sm" variant="ghost" onClick={stepForward}>▶</Button>
                <Button size="sm" variant="ghost" onClick={() => jumpToStep(selectedRun.snapshots.length - 1)}>⏭</Button>
                <span className="text-xs text-fg-muted ml-4">
                  Step {currentStep + 1} / {selectedRun.snapshots.length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* View Mode Toggle */}
          <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg w-fit">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                viewMode === 'timeline' ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              Timeline
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                viewMode === 'detail' ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              State Inspector
            </button>
          </div>

          {/* Content */}
          {viewMode === 'timeline' ? (
            <div className="space-y-2">
              {selectedRun.snapshots.map((snapshot, i) => (
                <div
                  key={snapshot.id}
                  className={cn(
                    'flex items-start gap-4 p-3 rounded-lg transition-all cursor-pointer',
                    i === currentStep ? 'bg-accent/10 border border-accent' : 'hover:bg-bg-hover',
                    i > currentStep && 'opacity-40'
                  )}
                  onClick={() => jumpToStep(i)}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    phaseColors[snapshot.state.phase as string] || 'bg-accent',
                    'text-white'
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-fg">{snapshot.action}</span>
                      <Badge variant="outline" size="sm">{snapshot.state.phase as string}</Badge>
                    </div>
                    <div className="text-xs text-fg-muted mt-1">
                      {snapshot.duration > 0 && `${(snapshot.duration / 1000).toFixed(1)}s`}
                      {snapshot.tokensUsed > 0 && ` • ${snapshot.tokensUsed.toLocaleString()} tokens`}
                      {snapshot.modelUsed !== 'system' && ` • ${snapshot.modelUsed}`}
                    </div>
                  </div>
                  <span className="text-[10px] text-fg-muted shrink-0">
                    {new Date(snapshot.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State */}
              <Card>
                <CardHeader>
                  <CardTitle>State at Step {currentStep + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-bg-tertiary rounded-lg p-4 text-xs font-mono text-fg-muted overflow-x-auto max-h-[400px] overflow-y-auto">
                    {JSON.stringify(currentSnapshot?.state, null, 2)}
                  </pre>
                </CardContent>
              </Card>

              {/* LLM Reasoning */}
              <Card>
                <CardHeader>
                  <CardTitle>LLM Reasoning</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSnapshot?.modelUsed !== 'system' ? (
                    <div className="space-y-3">
                      <div className="bg-bg-tertiary rounded-lg p-3">
                        <div className="text-xs text-fg-muted mb-1">Model</div>
                        <div className="text-sm text-fg font-medium">{currentSnapshot?.modelUsed}</div>
                      </div>
                      <div className="bg-bg-tertiary rounded-lg p-3">
                        <div className="text-xs text-fg-muted mb-1">Tokens Used</div>
                        <div className="text-sm text-fg font-medium">{currentSnapshot?.tokensUsed.toLocaleString()}</div>
                      </div>
                      <div className="bg-bg-tertiary rounded-lg p-3">
                        <div className="text-xs text-fg-muted mb-1">Duration</div>
                        <div className="text-sm text-fg font-medium">{(currentSnapshot?.duration || 0) / 1000}s</div>
                      </div>
                      <div className="bg-bg-tertiary rounded-lg p-3">
                        <div className="text-xs text-fg-muted mb-2">Reasoning Chain</div>
                        <div className="space-y-2 text-xs text-fg-muted">
                          <p>1. Analyzed file structure and imports</p>
                          <p>2. Identified potential vulnerability pattern</p>
                          <p>3. Cross-referenced with security rules database</p>
                          <p>4. Generated fix suggestion with confidence score</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-fg-muted text-center py-8">
                      System step - no LLM reasoning available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TimeTravelDebug;

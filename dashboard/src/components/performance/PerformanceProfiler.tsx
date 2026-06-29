import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Modal } from '../ui/Modal';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProfileStatus = 'idle' | 'recording' | 'processing' | 'complete';
export type FlamegraphType = 'cpu' | 'memory' | 'io' | 'offcpu';

export interface StackFrame {
  function: string;
  file?: string;
  line?: number;
  children: StackFrame[];
  selfTime: number;
  totalTime: number;
}

export interface Regression {
  id: string;
  function: string;
  baselineTime: number;
  currentTime: number;
  changePercent: number;
  severity: 'critical' | 'warning' | 'info';
  commit?: string;
}

export interface ProfileSession {
  id: string;
  name: string;
  type: FlamegraphType;
  status: ProfileStatus;
  duration: number;
  recordedAt: string;
  totalSamples: number;
  topFrames: StackFrame[];
  regressions: Regression[];
}

interface PerformanceProfilerProps {
  sessions?: ProfileSession[];
  currentSession?: ProfileSession | null;
  profiling?: boolean;
  onStartProfile?: (type: FlamegraphType, duration: number) => void;
  onStopProfile?: () => void;
  onCompareSessions?: (baselineId: string, currentId: string) => void;
  onDeleteSession?: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatPercent(pct: number): string {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-error';
    case 'warning': return 'text-warning';
    case 'info': return 'text-info';
    default: return 'text-fg-muted';
  }
}

function severityVariant(severity: string) {
  switch (severity) {
    case 'critical': return 'error';
    case 'warning': return 'warning';
    case 'info': return 'info';
    default: return 'default';
  }
}

// ─── Components ──────────────────────────────────────────────────────────────

function FlamegraphCanvas({ frames, maxDepth = 8 }: { frames: StackFrame[]; maxDepth?: number }) {
  const totalTime = frames.reduce((sum, f) => sum + f.totalTime, 0);
  const [hoveredFrame, setHoveredFrame] = useState<StackFrame | null>(null);

  function renderFrame(frame: StackFrame, depth: number, offset: number) {
    const width = (frame.totalTime / totalTime) * 100;
    if (depth >= maxDepth || width < 0.5) return null;

    const colors = [
      'bg-accent/60', 'bg-accent/40', 'bg-accent/30', 'bg-accent/20',
      'bg-purple/40', 'bg-purple/30', 'bg-purple/20', 'bg-purple/10',
    ];
    const color = colors[depth % colors.length];

    return (
      <div key={`${frame.function}-${offset}-${depth}`} className="relative">
        <div
          className={cn(
            'h-6 rounded-sm flex items-center px-2 cursor-pointer transition-all hover:ring-1 hover:ring-white/30 mb-px',
            color
          )}
          style={{ width: `${width}%`, marginLeft: `${offset}%` }}
          onMouseEnter={() => setHoveredFrame(frame)}
          onMouseLeave={() => setHoveredFrame(null)}
          title={`${frame.function} - ${formatTime(frame.totalTime)} (${((frame.totalTime / totalTime) * 100).toFixed(1)}%)`}
        >
          {width > 3 && (
            <span className="text-[10px] text-white/80 truncate font-mono">{frame.function}</span>
          )}
        </div>
        {frame.children.map((child, i) => renderFrame(child, depth + 1, offset))}
        {(() => {
          let childOffset = offset;
          frame.children.forEach(child => {
            childOffset += (child.totalTime / totalTime) * 100;
          });
          return null;
        })()}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="space-y-px p-3 bg-bg-tertiary rounded-lg min-h-[200px]">
        {frames.map((frame, i) => renderFrame(frame, 0, 0))}
      </div>
      {hoveredFrame && (
        <div className="absolute top-2 right-2 p-3 bg-card-bg border border-card-border rounded-lg shadow-xl z-10 min-w-[200px]">
          <p className="text-xs font-mono text-fg font-medium truncate">{hoveredFrame.function}</p>
          {hoveredFrame.file && (
            <p className="text-[10px] text-fg-muted mt-1">{hoveredFrame.file}:{hoveredFrame.line}</p>
          )}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-[10px] text-fg-muted">Self:</span>
              <span className="text-[10px] text-fg font-mono">{formatTime(hoveredFrame.selfTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-fg-muted">Total:</span>
              <span className="text-[10px] text-fg font-mono">{formatTime(hoveredFrame.totalTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-fg-muted">% of total:</span>
              <span className="text-[10px] text-accent font-mono">{((hoveredFrame.totalTime / totalTime) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RegressionChart({ regressions }: { regressions: Regression[] }) {
  const maxChange = Math.max(...regressions.map(r => Math.abs(r.changePercent)), 1);

  return (
    <div className="space-y-2">
      {regressions.map(reg => (
        <div key={reg.id} className="flex items-center gap-3">
          <div className="w-32 truncate">
            <span className="text-xs font-mono text-fg">{reg.function}</span>
          </div>
          <div className="flex-1 h-4 bg-bg-tertiary rounded-full overflow-hidden relative">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                reg.severity === 'critical' ? 'bg-error' : reg.severity === 'warning' ? 'bg-warning' : 'bg-info'
              )}
              style={{ width: `${(Math.abs(reg.changePercent) / maxChange) * 100}%` }}
            />
          </div>
          <span className={cn('text-xs font-mono w-16 text-right', severityColor(reg.severity))}>
            {formatPercent(reg.changePercent)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PerformanceProfiler({
  sessions = [],
  currentSession = null,
  profiling = false,
  onStartProfile,
  onStopProfile,
  onCompareSessions,
  onDeleteSession,
}: PerformanceProfilerProps) {
  const [profileType, setProfileType] = useState<FlamegraphType>('cpu');
  const [profileDuration, setProfileDuration] = useState(30);
  const [selectedSession, setSelectedSession] = useState<ProfileSession | null>(null);
  const [baselineId, setBaselineId] = useState<string>('');
  const [compareId, setCompareId] = useState<string>('');
  const [showFlamegraph, setShowFlamegraph] = useState(true);

  const activeSessions = useMemo(() => {
    return sessions.filter(s => s.status === 'complete').sort((a, b) =>
      new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
  }, [sessions]);

  const allRegressions = useMemo(() => {
    return activeSessions.flatMap(s => s.regressions);
  }, [activeSessions]);

  const handleCompare = useCallback(() => {
    if (baselineId && compareId) {
      onCompareSessions?.(baselineId, compareId);
    }
  }, [baselineId, compareId, onCompareSessions]);

  return (
    <div className="space-y-6">
      {/* Profiling Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Profiler</CardTitle>
          <CardDescription>eBPF/perf-based profiling with flamegraph visualization and regression detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-fg mb-1.5">Profile Type</label>
              <Select
                options={[
                  { value: 'cpu', label: 'CPU (perf/eBPF)' },
                  { value: 'memory', label: 'Memory Allocations' },
                  { value: 'io', label: 'I/O Operations' },
                  { value: 'offcpu', label: 'Off-CPU (wait time)' },
                ]}
                value={profileType}
                onChange={e => setProfileType(e.target.value as FlamegraphType)}
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-fg mb-1.5">Duration (s)</label>
              <Input
                type="number"
                min={5}
                max={300}
                value={profileDuration}
                onChange={e => setProfileDuration(parseInt(e.target.value) || 30)}
              />
            </div>
            <div className="flex gap-2">
              {!profiling ? (
                <Button
                  variant="primary"
                  onClick={() => onStartProfile?.(profileType, profileDuration)}
                >
                  Start Profiling
                </Button>
              ) : (
                <Button variant="danger" onClick={onStopProfile}>
                  Stop
                </Button>
              )}
            </div>
          </div>

          {profiling && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="w-3 h-3 bg-error rounded-full animate-pulse" />
              <span className="text-sm text-accent">
                Recording {profileType} profile for {profileDuration}s...
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Session / Latest Results */}
      {(currentSession || activeSessions[0]) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentSession?.name || activeSessions[0]?.name || 'Latest Profile'}</CardTitle>
                <CardDescription>
                  {currentSession
                    ? `${currentSession.totalSamples} samples • ${formatTime(currentSession.totalSamples * 1)} estimated`
                    : `${activeSessions[0]?.totalSamples} samples • recorded ${activeSessions[0]?.recordedAt}`
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  label="Flamegraph"
                  checked={showFlamegraph}
                  onChange={e => setShowFlamegraph(e.target.checked)}
                  size="sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Flamegraph */}
            {showFlamegraph && (currentSession?.topFrames || activeSessions[0]?.topFrames) && (
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Flamegraph</h4>
                <FlamegraphCanvas frames={currentSession?.topFrames || activeSessions[0]?.topFrames || []} />
              </div>
            )}

            {/* Regressions */}
            {(currentSession?.regressions || activeSessions[0]?.regressions || []).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">
                  Regressions Detected
                  <Badge variant="error" size="sm" className="ml-2">
                    {(currentSession?.regressions || activeSessions[0]?.regressions || []).length}
                  </Badge>
                </h4>
                <RegressionChart regressions={currentSession?.regressions || activeSessions[0]?.regressions || []} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session History & Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Compare profiles to detect performance regressions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Comparison Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 p-3 bg-bg-tertiary rounded-lg">
            <Select
              label="Baseline"
              options={[
                { value: '', label: 'Select baseline...' },
                ...activeSessions.map(s => ({ value: s.id, label: `${s.name} (${s.recordedAt})` })),
              ]}
              value={baselineId}
              onChange={e => setBaselineId(e.target.value)}
            />
            <Select
              label="Compare"
              options={[
                { value: '', label: 'Select session...' },
                ...activeSessions.map(s => ({ value: s.id, label: `${s.name} (${s.recordedAt})` })),
              ]}
              value={compareId}
              onChange={e => setCompareId(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                variant="primary"
                size="sm"
                disabled={!baselineId || !compareId}
                onClick={handleCompare}
              >
                Compare
              </Button>
            </div>
          </div>

          {/* Sessions Table */}
          {activeSessions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-fg-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-fg font-medium">No profile sessions yet</p>
              <p className="text-sm text-fg-muted mt-1">Start a profiling session to see results here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeSessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center gap-4 p-3 bg-bg-secondary rounded-lg border border-border hover:bg-bg-hover transition-colors cursor-pointer"
                  onClick={() => setSelectedSession(session)}
                >
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    session.type === 'cpu' ? 'bg-accent' :
                    session.type === 'memory' ? 'bg-purple' :
                    session.type === 'io' ? 'bg-warning' : 'bg-info'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-fg font-medium truncate">{session.name}</p>
                    <p className="text-xs text-fg-muted">
                      {session.type.toUpperCase()} • {session.totalSamples} samples • {session.recordedAt}
                    </p>
                  </div>
                  {session.regressions.length > 0 && (
                    <Badge variant="error" size="sm">{session.regressions.length} regressions</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={e => { e.stopPropagation(); onDeleteSession?.(session.id); }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      <Modal
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.name || 'Profile Session'}
        size="xl"
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-lg font-bold text-fg">{selectedSession.totalSamples}</p>
                <p className="text-xs text-fg-muted">Samples</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-lg font-bold text-fg">{selectedSession.topFrames.length}</p>
                <p className="text-xs text-fg-muted">Top Frames</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className={cn('text-lg font-bold', selectedSession.regressions.length > 0 ? 'text-error' : 'text-success')}>
                  {selectedSession.regressions.length}
                </p>
                <p className="text-xs text-fg-muted">Regressions</p>
              </div>
            </div>

            {selectedSession.topFrames.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Flamegraph</h4>
                <FlamegraphCanvas frames={selectedSession.topFrames} />
              </div>
            )}

            {selectedSession.regressions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Regressions</h4>
                <RegressionChart regressions={selectedSession.regressions} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PerformanceProfiler;

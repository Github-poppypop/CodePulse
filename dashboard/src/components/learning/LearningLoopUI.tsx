import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface TrainingCycle {
  id: number;
  date: string;
  rejectedCount: number;
  retrainedSamples: number;
  accuracyBefore: number;
  accuracyAfter: number;
  improvementPercent: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
}

interface RejectedFix {
  id: string;
  title: string;
  reason: string;
  rejectedAt: string;
  usedForTraining: boolean;
  findingId: string;
}

interface FeedbackLoop {
  phase: 'collect' | 'analyze' | 'retrain' | 'deploy' | 'validate';
  label: string;
  status: 'done' | 'active' | 'pending';
  description: string;
  metrics?: string;
}

const trainingCycles: TrainingCycle[] = [
  { id: 8, date: '2026-06-28T12:00:00Z', rejectedCount: 12, retrainedSamples: 340, accuracyBefore: 0.847, accuracyAfter: 0.869, improvementPercent: 2.2, status: 'COMPLETED' },
  { id: 7, date: '2026-06-27T12:00:00Z', rejectedCount: 8, retrainedSamples: 220, accuracyBefore: 0.831, accuracyAfter: 0.847, improvementPercent: 1.6, status: 'COMPLETED' },
  { id: 6, date: '2026-06-26T12:00:00Z', rejectedCount: 15, retrainedSamples: 450, accuracyBefore: 0.812, accuracyAfter: 0.831, improvementPercent: 1.9, status: 'COMPLETED' },
  { id: 5, date: '2026-06-25T12:00:00Z', rejectedCount: 6, retrainedSamples: 180, accuracyBefore: 0.799, accuracyAfter: 0.812, improvementPercent: 1.3, status: 'COMPLETED' },
  { id: 4, date: '2026-06-24T12:00:00Z', rejectedCount: 20, retrainedSamples: 580, accuracyBefore: 0.772, accuracyAfter: 0.799, improvementPercent: 2.7, status: 'COMPLETED' },
];

const rejectedFixes: RejectedFix[] = [
  { id: 'rf1', title: 'Incorrect null check pattern', reason: 'Used optional chaining where explicit null check was needed', rejectedAt: '2026-06-28T14:28:00Z', usedForTraining: true, findingId: 'f1235' },
  { id: 'rf2', title: 'Wrong import path', reason: 'Suggested import from deprecated module path', rejectedAt: '2026-06-28T13:10:00Z', usedForTraining: true, findingId: 'f1236' },
  { id: 'rf3', title: 'Overly broad type change', reason: 'Changed type from string to any, losing type safety', rejectedAt: '2026-06-28T11:45:00Z', usedForTraining: true, findingId: 'f1237' },
  { id: 'rf4', title: 'Missing edge case handling', reason: 'Fix did not handle empty array case', rejectedAt: '2026-06-28T10:20:00Z', usedForTraining: false, findingId: 'f1238' },
  { id: 'rf5', title: 'Incorrect async pattern', reason: 'Used .then() where async/await was more appropriate', rejectedAt: '2026-06-28T09:00:00Z', usedForTraining: false, findingId: 'f1239' },
];

const feedbackLoop: FeedbackLoop[] = [
  { phase: 'collect', label: 'Collect', status: 'done', description: 'Gather rejected fixes and user feedback', metrics: '12 rejections today' },
  { phase: 'analyze', label: 'Analyze', status: 'done', description: 'Identify patterns in rejected fixes', metrics: '3 new patterns found' },
  { phase: 'retrain', label: 'Retrain', status: 'active', description: 'Fine-tune model with new training data', metrics: 'ETA: 45 minutes' },
  { phase: 'deploy', label: 'Deploy', status: 'pending', description: 'Deploy updated model to production' },
  { phase: 'validate', label: 'Validate', status: 'pending', description: 'A/B test new model against baseline' },
];

export function LearningLoopUI() {
  const [activeTab, setActiveTab] = React.useState<'loop' | 'cycles' | 'rejected'>('loop');
  const [isTraining, setIsTraining] = React.useState(false);

  const startTraining = () => {
    setIsTraining(true);
    setTimeout(() => setIsTraining(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Learning Loop</h2>
          <p className="text-sm text-fg-muted mt-1">Rejected fixes → retraining → improved suggestions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>Active</Badge>
          <Button size="sm" loading={isTraining} onClick={startTraining}>
            {isTraining ? 'Training...' : 'Trigger Retrain'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Model Accuracy</div>
          <div className="text-2xl font-bold text-green">86.9%</div>
          <div className="text-xs text-green mt-1">+2.2% this cycle</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Training Samples</div>
          <div className="text-2xl font-bold text-fg">1,770</div>
          <div className="text-xs text-fg-muted mt-1">From 61 rejected fixes</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Cycles Completed</div>
          <div className="text-2xl font-bold text-fg">8</div>
          <div className="text-xs text-fg-muted mt-1">Last: 6 hours ago</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Avg Improvement</div>
          <div className="text-2xl font-bold text-accent">+1.9%</div>
          <div className="text-xs text-fg-muted mt-1">Per training cycle</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg w-fit">
        {(['loop', 'cycles', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize',
              activeTab === tab ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
            )}
          >
            {tab === 'loop' ? 'Feedback Loop' : tab === 'cycles' ? 'Training Cycles' : 'Rejected Fixes'}
          </button>
        ))}
      </div>

      {/* Feedback Loop Visualization */}
      {activeTab === 'loop' && (
        <Card>
          <CardHeader>
            <CardTitle>Continuous Learning Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Pipeline Steps */}
            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
              {feedbackLoop.map((step, i) => (
                <React.Fragment key={step.phase}>
                  <div className="flex flex-col items-center min-w-[120px]">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center mb-2 border-2',
                      step.status === 'done' ? 'bg-green/20 border-green text-green' :
                      step.status === 'active' ? 'bg-accent/20 border-accent text-accent animate-pulse' :
                      'bg-bg-tertiary border-border text-fg-muted'
                    )}>
                      {step.status === 'done' ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="4 10 8 14 16 6" /></svg>
                      ) : step.status === 'active' ? (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v16M2 10h16" /></svg>
                      ) : (
                        <span className="text-sm font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      step.status === 'done' ? 'text-green' :
                      step.status === 'active' ? 'text-accent' :
                      'text-fg-muted'
                    )}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-fg-muted text-center mt-1 max-w-[100px]">{step.description}</span>
                    {step.metrics && (
                      <span className="text-[10px] text-fg mt-1 bg-bg-tertiary px-2 py-0.5 rounded">{step.metrics}</span>
                    )}
                  </div>
                  {i < feedbackLoop.length - 1 && (
                    <div className={cn(
                      'h-0.5 flex-1 mx-2 min-w-[20px]',
                      step.status === 'done' ? 'bg-green' : 'bg-border'
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Current Training Progress */}
            <div className="bg-bg-tertiary rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-fg">Current Training Cycle #9</div>
                  <div className="text-xs text-fg-muted mt-0.5">Fine-tuning on 12 new rejected fixes</div>
                </div>
                <Badge variant="info">In Progress</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-fg-muted">Epoch 2/5</span>
                  <span className="text-fg">40%</span>
                </div>
                <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: '40%' }} />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <div className="text-[10px] text-fg-muted">Loss</div>
                    <div className="text-sm font-medium text-fg">0.234</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-fg-muted">Val Accuracy</div>
                    <div className="text-sm font-medium text-fg">85.2%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-fg-muted">ETA</div>
                    <div className="text-sm font-medium text-fg">32 min</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Training Cycles Tab */}
      {activeTab === 'cycles' && (
        <Card>
          <CardHeader>
            <CardTitle>Training History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingCycles.map(cycle => (
                <div key={cycle.id} className="p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-fg">Cycle #{cycle.id}</span>
                      <Badge variant="success" size="sm">+{cycle.improvementPercent}%</Badge>
                    </div>
                    <span className="text-xs text-fg-muted">{new Date(cycle.date).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-fg-muted">Rejected Fixes</div>
                      <div className="text-fg font-medium">{cycle.rejectedCount}</div>
                    </div>
                    <div>
                      <div className="text-fg-muted">Training Samples</div>
                      <div className="text-fg font-medium">{cycle.retrainedSamples}</div>
                    </div>
                    <div>
                      <div className="text-fg-muted">Accuracy Before</div>
                      <div className="text-fg font-medium">{(cycle.accuracyBefore * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-fg-muted">Accuracy After</div>
                      <div className="text-green font-medium">{(cycle.accuracyAfter * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  {/* Mini chart */}
                  <div className="mt-3 flex items-end gap-0.5 h-8">
                    {Array.from({ length: 20 }).map((_, i) => {
                      const height = 20 + Math.sin(i * 0.5 + cycle.id) * 30 + cycle.improvementPercent * 5;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-accent/40 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected Fixes Tab */}
      {activeTab === 'rejected' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Rejected Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rejectedFixes.map(fix => (
                <div key={fix.id} className="p-4 bg-bg-tertiary rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-fg">{fix.title}</h4>
                        {fix.usedForTraining ? (
                          <Badge variant="success" size="sm">Used for training</Badge>
                        ) : (
                          <Badge variant="outline" size="sm">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-fg-muted mt-1">{fix.reason}</p>
                      <div className="text-[10px] text-fg-muted mt-2">
                        Rejected {new Date(fix.rejectedAt).toLocaleString()} • Finding: {fix.findingId}
                      </div>
                    </div>
                    {!fix.usedForTraining && (
                      <Button size="xs" variant="ghost">Add to Training</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default LearningLoopUI;

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

interface BenchmarkTask {
  id: string;
  name: string;
  description: string;
  category: 'BUG_FIX' | 'FEATURE' | 'REFACTOR' | 'SECURITY' | 'PERFORMANCE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  language: string;
  tokensUsed: number;
  solveRate: number;
  avgTime: number;
}

interface BenchmarkSuite {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  tasks: BenchmarkTask[];
}

interface LeaderboardEntry {
  rank: number;
  model: string;
  organization: string;
  overallScore: number;
  humanEval: number;
  swebench: number;
  customScore: number;
  tokensPerTask: number;
  trend: 'up' | 'down' | 'stable';
}

const benchmarkSuites: BenchmarkSuite[] = [
  {
    id: 'humaneval',
    name: 'HumanEval',
    description: '164 hand-written programming tasks evaluating functional correctness',
    taskCount: 164,
    tasks: [
      { id: 'he1', name: 'Two Sum', description: 'Find two numbers that add up to target', category: 'FEATURE', difficulty: 'EASY', language: 'Python', tokensUsed: 1200, solveRate: 0.92, avgTime: 12 },
      { id: 'he2', name: 'Valid Parentheses', description: 'Check if string has valid bracket matching', category: 'FEATURE', difficulty: 'EASY', language: 'Python', tokensUsed: 980, solveRate: 0.88, avgTime: 10 },
      { id: 'he3', name: 'Merge Sorted Lists', description: 'Merge two sorted linked lists', category: 'FEATURE', difficulty: 'MEDIUM', language: 'Python', tokensUsed: 2100, solveRate: 0.76, avgTime: 18 },
      { id: 'he4', name: 'LRU Cache', description: 'Implement least recently used cache', category: 'FEATURE', difficulty: 'HARD', language: 'Python', tokensUsed: 3400, solveRate: 0.54, avgTime: 25 },
    ],
  },
  {
    id: 'swebench',
    name: 'SWE-bench',
    description: 'Real-world GitHub issues with corresponding pull requests',
    taskCount: 500,
    tasks: [
      { id: 'sw1', name: 'Django #32456', description: 'Fix QuerySet ordering regression', category: 'BUG_FIX', difficulty: 'MEDIUM', language: 'Python', tokensUsed: 8500, solveRate: 0.42, avgTime: 45 },
      { id: 'sw2', name: 'Flask #4521', description: 'URL routing edge case with special chars', category: 'BUG_FIX', difficulty: 'HARD', language: 'Python', tokensUsed: 12000, solveRate: 0.28, avgTime: 62 },
      { id: 'sw3', name: 'Requests #5890', description: 'Add timeout parameter to Session', category: 'FEATURE', difficulty: 'EASY', language: 'Python', tokensUsed: 4200, solveRate: 0.68, avgTime: 30 },
      { id: 'sw4', name: 'NumPy #18234', description: 'Memory leak in array operations', category: 'BUG_FIX', difficulty: 'HARD', language: 'Python', tokensUsed: 15000, solveRate: 0.18, avgTime: 78 },
    ],
  },
  {
    id: 'custom',
    name: 'CodePulse Custom',
    description: 'Organization-specific benchmarks based on your codebase patterns',
    taskCount: 87,
    tasks: [
      { id: 'cp1', name: 'Auth Module Security', description: 'Find and fix security issues in auth module', category: 'SECURITY', difficulty: 'MEDIUM', language: 'TypeScript', tokensUsed: 5600, solveRate: 0.71, avgTime: 35 },
      { id: 'cp2', name: 'API Performance', description: 'Optimize slow database queries', category: 'PERFORMANCE', difficulty: 'HARD', language: 'TypeScript', tokensUsed: 7800, solveRate: 0.45, avgTime: 50 },
      { id: 'cp3', name: 'Type Safety Pass', description: 'Fix all type safety issues in shared module', category: 'REFACTOR', difficulty: 'EASY', language: 'TypeScript', tokensUsed: 3200, solveRate: 0.82, avgTime: 20 },
    ],
  },
];

const leaderboard: LeaderboardEntry[] = [
  { rank: 1, model: 'CodePulse v3.2', organization: 'CodePulse', overallScore: 94.2, humanEval: 96.3, swebench: 48.2, customScore: 91.5, tokensPerTask: 4500, trend: 'up' },
  { rank: 2, model: 'Claude Sonnet 4', organization: 'Anthropic', overallScore: 92.8, humanEval: 94.5, swebench: 52.1, customScore: 85.3, tokensPerTask: 5200, trend: 'up' },
  { rank: 3, model: 'GPT-4o', organization: 'OpenAI', overallScore: 89.5, humanEval: 92.1, swebench: 44.8, customScore: 82.7, tokensPerTask: 6100, trend: 'stable' },
  { rank: 4, model: 'Gemini 2.5 Pro', organization: 'Google', overallScore: 87.3, humanEval: 90.2, swebench: 41.5, customScore: 80.1, tokensPerTask: 5800, trend: 'up' },
  { rank: 5, model: 'CodePulse v3.1', organization: 'CodePulse', overallScore: 85.1, humanEval: 88.7, swebench: 38.4, customScore: 83.2, tokensPerTask: 4800, trend: 'down' },
  { rank: 6, model: 'DeepSeek V3', organization: 'DeepSeek', overallScore: 83.6, humanEval: 89.4, swebench: 36.2, customScore: 74.8, tokensPerTask: 3900, trend: 'up' },
  { rank: 7, model: 'Llama 4 405B', organization: 'Meta', overallScore: 78.2, humanEval: 82.1, swebench: 30.5, customScore: 68.4, tokensPerTask: 7200, trend: 'stable' },
];

export function BenchmarkSuite() {
  const [activeTab, setActiveTab] = React.useState<'suites' | 'leaderboard' | 'custom'>('suites');
  const [selectedSuite, setSelectedSuite] = React.useState<BenchmarkSuite | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [runProgress, setRunProgress] = React.useState(0);

  const runBenchmark = () => {
    setIsRunning(true);
    setRunProgress(0);
    const interval = setInterval(() => {
      setRunProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return prev + 2;
      });
    }, 200);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green';
      case 'MEDIUM': return 'text-yellow';
      case 'HARD': return 'text-red';
      default: return 'text-fg-muted';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <span className="text-green">↑</span>;
      case 'down': return <span className="text-red">↓</span>;
      default: return <span className="text-fg-muted">→</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Benchmark Suite</h2>
          <p className="text-sm text-fg-muted mt-1">Standard benchmarks (HumanEval, SWE-bench, custom) with leaderboard</p>
        </div>
        <Button loading={isRunning} onClick={runBenchmark}>
          {isRunning ? `Running... ${runProgress}%` : 'Run All Benchmarks'}
        </Button>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-fg">Running benchmarks...</span>
              <span className="text-sm text-fg-muted">{runProgress}%</span>
            </div>
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-200" style={{ width: `${runProgress}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Total Tasks</div>
          <div className="text-2xl font-bold text-fg">{benchmarkSuites.reduce((sum, s) => sum + s.taskCount, 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Overall Score</div>
          <div className="text-2xl font-bold text-green">94.2</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Best Category</div>
          <div className="text-2xl font-bold text-fg">HumanEval</div>
          <div className="text-xs text-green mt-1">96.3% pass rate</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Leaderboard Position</div>
          <div className="text-2xl font-bold text-yellow">#1</div>
          <div className="text-xs text-green mt-1">↑ from #2</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg w-fit">
        {(['suites', 'leaderboard', 'custom'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize',
              activeTab === tab ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Benchmark Suites */}
      {activeTab === 'suites' && !selectedSuite && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benchmarkSuites.map(suite => (
            <Card key={suite.id} hover className="cursor-pointer" onClick={() => setSelectedSuite(suite)}>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-fg">{suite.name}</h3>
                  <Badge variant="info">{suite.taskCount} tasks</Badge>
                </div>
                <p className="text-xs text-fg-muted mb-4">{suite.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {suite.tasks.map(t => (
                      <div
                        key={t.id}
                        className={cn('w-3 h-3 rounded-full', getDifficultyColor(t.difficulty))}
                        title={`${t.difficulty}: ${t.name}`}
                      />
                    ))}
                  </div>
                  <Button size="xs">View Tasks</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Suite Detail */}
      {activeTab === 'suites' && selectedSuite && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelectedSuite(null)}>← Back</Button>
            <h3 className="text-lg font-semibold text-fg">{selectedSuite.name}</h3>
          </div>
          <Card>
            <CardContent padding="none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Task</th>
                    <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Difficulty</th>
                    <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Solve Rate</th>
                    <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Avg Time</th>
                    <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSuite.tasks.map(task => (
                    <tr key={task.id} className="border-b border-border/50 hover:bg-bg-hover">
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-fg">{task.name}</div>
                        <div className="text-[10px] text-fg-muted">{task.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={task.category === 'SECURITY' ? 'error' : task.category === 'BUG_FIX' ? 'warning' : 'info'} size="sm">
                          {task.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('text-xs font-medium', getDifficultyColor(task.difficulty))}>{task.difficulty}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', task.solveRate >= 0.7 ? 'bg-green' : task.solveRate >= 0.4 ? 'bg-yellow' : 'bg-red')} style={{ width: `${task.solveRate * 100}%` }} />
                          </div>
                          <span className="text-xs text-fg">{(task.solveRate * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-fg-muted">{task.avgTime}s</td>
                      <td className="py-3 px-4 text-xs text-fg-muted">{task.tokensUsed.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <Card>
          <CardHeader>
            <CardTitle>Model Leaderboard</CardTitle>
          </CardHeader>
          <CardContent padding="none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Rank</th>
                  <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Model</th>
                  <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Overall</th>
                  <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">HumanEval</th>
                  <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">SWE-bench</th>
                  <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Custom</th>
                  <th className="text-right py-3 px-4 text-xs text-fg-muted font-medium">Tokens/Task</th>
                  <th className="text-center py-3 px-4 text-xs text-fg-muted font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(entry => (
                  <tr
                    key={entry.rank}
                    className={cn(
                      'border-b border-border/50 hover:bg-bg-hover',
                      entry.organization === 'CodePulse' && 'bg-accent/5'
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className={cn(
                        'font-bold',
                        entry.rank === 1 ? 'text-yellow' : entry.rank === 2 ? 'text-fg-muted' : entry.rank === 3 ? 'text-orange' : 'text-fg'
                      )}>
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium text-fg">{entry.model}</div>
                        <div className="text-[10px] text-fg-muted">{entry.organization}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn('text-sm font-bold', entry.overallScore >= 90 ? 'text-green' : entry.overallScore >= 80 ? 'text-yellow' : 'text-fg')}>
                        {entry.overallScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-fg">{entry.humanEval}%</td>
                    <td className="py-3 px-4 text-right text-xs text-fg">{entry.swebench}%</td>
                    <td className="py-3 px-4 text-right text-xs text-fg">{entry.customScore}%</td>
                    <td className="py-3 px-4 text-right text-xs text-fg-muted">{entry.tokensPerTask.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center text-sm">{getTrendIcon(entry.trend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Custom Benchmarks */}
      {activeTab === 'custom' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Benchmark Name" placeholder="e.g., Auth Module Tests" />
                <Select
                  label="Base Suite"
                  options={[
                    { value: 'humaneval', label: 'HumanEval' },
                    { value: 'swebench', label: 'SWE-bench' },
                    { value: 'empty', label: 'From Scratch' },
                  ]}
                />
                <Input label="Task Count" type="number" placeholder="50" />
                <Select
                  label="Language"
                  options={[
                    { value: 'typescript', label: 'TypeScript' },
                    { value: 'python', label: 'Python' },
                    { value: 'go', label: 'Go' },
                    { value: 'rust', label: 'Rust' },
                  ]}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button>Create & Run</Button>
                <Button variant="outline">Import from File</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Custom Benchmarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Auth Security Suite', tasks: 24, score: 91.5, lastRun: '2 hours ago' },
                  { name: 'API Performance', tasks: 18, score: 78.2, lastRun: '1 day ago' },
                  { name: 'Frontend Patterns', tasks: 35, score: 85.7, lastRun: '3 days ago' },
                  { name: 'Code Quality', tasks: 12, score: 93.1, lastRun: '5 days ago' },
                ].map((bench, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-fg">{bench.name}</div>
                      <div className="text-xs text-fg-muted">{bench.tasks} tasks • Last run: {bench.lastRun}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={cn('text-sm font-bold', bench.score >= 90 ? 'text-green' : bench.score >= 80 ? 'text-yellow' : 'text-fg')}>
                          {bench.score}%
                        </div>
                        <div className="text-[10px] text-fg-muted">score</div>
                      </div>
                      <Button size="xs" variant="outline">Run</Button>
                      <Button size="xs" variant="ghost">Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default BenchmarkSuite;

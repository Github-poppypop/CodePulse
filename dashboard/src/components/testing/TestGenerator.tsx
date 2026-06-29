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

export type TestType = 'unit' | 'integration' | 'e2e';
export type TestStatus = 'pending' | 'generating' | 'passing' | 'failing' | 'mutated';
export type MutationType = 'boundary' | 'operator' | 'negation' | 'return' | 'deletion';

export interface GeneratedTest {
  id: string;
  name: string;
  type: TestType;
  status: TestStatus;
  targetFunction: string;
  targetFile: string;
  code: string;
  coverage: number;
  mutationsSurvived: number;
  mutationsTotal: number;
  generatedAt: string;
}

export interface MutationResult {
  id: string;
  testId: string;
  mutationType: MutationType;
  originalCode: string;
  mutatedCode: string;
  killed: boolean;
  description: string;
}

export interface TestGeneratorConfig {
  autoGenerateOnFix: boolean;
  minCoverage: number;
  enableMutationTesting: boolean;
  testFramework: string;
  maxTestsPerFunction: number;
  includeEdgeCases: boolean;
}

interface TestGeneratorProps {
  tests?: GeneratedTest[];
  mutations?: MutationResult[];
  config?: TestGeneratorConfig;
  generating?: boolean;
  onGenerate?: (targetFile?: string, targetFunction?: string) => void;
  onRunTests?: (ids: string[]) => void;
  onDeleteTest?: (id: string) => void;
  onConfigChange?: (config: TestGeneratorConfig) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: TestGeneratorConfig = {
  autoGenerateOnFix: true,
  minCoverage: 80,
  enableMutationTesting: true,
  testFramework: 'jest',
  maxTestsPerFunction: 5,
  includeEdgeCases: true,
};

function statusVariant(status: TestStatus) {
  switch (status) {
    case 'passing': return 'success';
    case 'failing': return 'error';
    case 'generating': return 'info';
    case 'mutated': return 'warning';
    case 'pending': return 'default';
  }
}

function statusLabel(status: TestStatus) {
  switch (status) {
    case 'passing': return 'Passing';
    case 'failing': return 'Failing';
    case 'generating': return 'Generating';
    case 'mutated': return 'Mutated';
    case 'pending': return 'Pending';
  }
}

function mutationTypeLabel(type: MutationType): string {
  switch (type) {
    case 'boundary': return 'Boundary Value';
    case 'operator': return 'Arithmetic Operator';
    case 'negation': return 'Condition Negation';
    case 'return': return 'Return Value';
    case 'deletion': return 'Statement Deletion';
  }
}

function coverageColor(coverage: number): string {
  if (coverage >= 80) return 'text-success';
  if (coverage >= 60) return 'text-warning';
  return 'text-error';
}

// ─── Components ──────────────────────────────────────────────────────────────

function CoverageRing({ coverage, size = 48 }: { coverage: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (coverage / 100) * circumference;
  const color = coverage >= 80 ? 'stroke-success' : coverage >= 60 ? 'stroke-warning' : 'stroke-error';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-bg-tertiary"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-500', color)}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-xs font-bold', coverageColor(coverage))}>{coverage}%</span>
      </div>
    </div>
  );
}

function MutationScoreBar({ survived, total }: { survived: number; total: number }) {
  const killed = total - survived;
  const killRate = total > 0 ? (killed / total) * 100 : 100;
  const color = killRate >= 80 ? 'bg-success' : killRate >= 60 ? 'bg-warning' : 'bg-error';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${killRate}%` }} />
      </div>
      <span className="text-xs text-fg-muted font-mono">{killed}/{total}</span>
    </div>
  );
}

function CodePreview({ code, language = 'typescript' }: { code: string; language?: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = code.split('\n');
  const displayLines = expanded ? lines : lines.slice(0, 12);

  return (
    <div className="relative">
      <div className="bg-bg-tertiary rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
          <span className="text-[10px] text-fg-muted font-mono">{language}</span>
          <button
            className="text-[10px] text-accent hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Collapse' : `Show all ${lines.length} lines`}
          </button>
        </div>
        <pre className="p-3 text-xs font-mono text-fg overflow-x-auto">
          {displayLines.map((line, i) => (
            <div key={i} className="flex">
              <span className="w-8 text-right text-fg-subtle select-none mr-3">{i + 1}</span>
              <span>{line}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TestGenerator({
  tests = [],
  mutations = [],
  config = DEFAULT_CONFIG,
  generating = false,
  onGenerate,
  onRunTests,
  onDeleteTest,
  onConfigChange,
}: TestGeneratorProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TestType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailTest, setDetailTest] = useState<GeneratedTest | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [targetFile, setTargetFile] = useState('');
  const [targetFunction, setTargetFunction] = useState('');

  const filteredTests = useMemo(() => {
    return tests.filter(t => {
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.targetFile.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [tests, search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const byStatus: Record<TestStatus, number> = { pending: 0, generating: 0, passing: 0, failing: 0, mutated: 0 };
    let totalCoverage = 0;
    let totalMutations = 0;
    let totalSurvived = 0;
    tests.forEach(t => {
      byStatus[t.status]++;
      totalCoverage += t.coverage;
      totalMutations += t.mutationsTotal;
      totalSurvived += t.mutationsSurvived;
    });
    return {
      total: tests.length,
      ...byStatus,
      avgCoverage: tests.length > 0 ? Math.round(totalCoverage / tests.length) : 0,
      mutationKillRate: totalMutations > 0 ? Math.round(((totalMutations - totalSurvived) / totalMutations) * 100) : 100,
    };
  }, [tests]);

  const testMutations = useMemo(() => {
    if (!detailTest) return [];
    return mutations.filter(m => m.testId === detailTest.id);
  }, [mutations, detailTest]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredTests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTests.map(t => t.id)));
    }
  }, [selectedIds.size, filteredTests]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-fg">{stats.total}</p>
          <p className="text-xs text-fg-muted">Total Tests</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-success">{stats.passing}</p>
          <p className="text-xs text-fg-muted">Passing</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-error">{stats.failing}</p>
          <p className="text-xs text-fg-muted">Failing</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className={cn('text-2xl font-bold', coverageColor(stats.avgCoverage))}>{stats.avgCoverage}%</p>
          <p className="text-xs text-fg-muted">Avg Coverage</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className={cn('text-2xl font-bold', stats.mutationKillRate >= 80 ? 'text-success' : 'text-warning')}>
            {stats.mutationKillRate}%
          </p>
          <p className="text-xs text-fg-muted">Mutation Kill Rate</p>
        </Card>
      </div>

      {/* Generate Controls */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-fg mb-1.5">Target File</label>
            <Input
              placeholder="e.g., src/utils/auth.ts"
              value={targetFile}
              onChange={e => setTargetFile(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-fg mb-1.5">Target Function (optional)</label>
            <Input
              placeholder="e.g., validateToken"
              value={targetFunction}
              onChange={e => setTargetFunction(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
              Config
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={generating}
              onClick={() => onGenerate?.(targetFile || undefined, targetFunction || undefined)}
            >
              {generating ? 'Generating...' : 'Generate Tests'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Toolbar */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 18 18">
                <circle cx="9" cy="9" r="7" /><path d="M13 13l4 4" />
              </svg>
              <input
                type="text"
                placeholder="Search tests..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'unit', label: 'Unit' },
                { value: 'integration', label: 'Integration' },
                { value: 'e2e', label: 'E2E' },
              ]}
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as TestType | 'all')}
              className="w-full sm:w-36"
            />
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'generating', label: 'Generating' },
                { value: 'passing', label: 'Passing' },
                { value: 'failing', label: 'Failing' },
                { value: 'mutated', label: 'Mutated' },
              ]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as TestStatus | 'all')}
              className="w-full sm:w-36"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <span className="text-xs text-fg-muted">{selectedIds.size} selected</span>
            <Button variant="primary" size="xs" onClick={() => onRunTests?.(Array.from(selectedIds))}>
              Run Tests
            </Button>
          </div>
        )}
      </Card>

      {/* Auto-Generate Banner */}
      {config.autoGenerateOnFix && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg">
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-sm text-accent">Auto-generate on fix enabled — tests are created automatically when code is fixed</span>
        </div>
      )}

      {/* Tests List */}
      <div className="space-y-2">
        {/* Select All */}
        <div className="flex items-center gap-3 px-1">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredTests.length && filteredTests.length > 0}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded border-border bg-bg-tertiary text-accent focus:ring-accent"
          />
          <span className="text-xs text-fg-muted">Select all ({filteredTests.length})</span>
        </div>

        {filteredTests.length === 0 ? (
          <Card padding="lg" className="text-center">
            <svg className="w-12 h-12 mx-auto text-fg-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-fg font-medium">No tests generated yet</p>
            <p className="text-sm text-fg-muted mt-1">Select a target file and generate AI-powered tests.</p>
          </Card>
        ) : (
          filteredTests.map(test => (
            <div
              key={test.id}
              className={cn(
                'flex items-start gap-3 p-4 bg-bg-secondary rounded-xl border transition-colors cursor-pointer',
                selectedIds.has(test.id) ? 'border-accent bg-accent/5' : 'border-border hover:bg-bg-hover'
              )}
              onClick={() => setDetailTest(test)}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(test.id)}
                onChange={() => toggleSelect(test.id)}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 mt-1 rounded border-border bg-bg-tertiary text-accent focus:ring-accent"
              />
              <CoverageRing coverage={test.coverage} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant={statusVariant(test.status)} size="sm">
                    {statusLabel(test.status)}
                  </Badge>
                  <Badge variant="outline" size="sm">{test.type}</Badge>
                  {config.enableMutationTesting && test.mutationsTotal > 0 && (
                    <MutationScoreBar survived={test.mutationsSurvived} total={test.mutationsTotal} />
                  )}
                </div>
                <p className="text-sm text-fg font-medium">{test.name}</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {test.targetFile} → <span className="font-mono">{test.targetFunction}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="xs" onClick={e => { e.stopPropagation(); onRunTests?.([test.id]); }}>
                  Run
                </Button>
                <Button variant="ghost" size="xs" onClick={e => { e.stopPropagation(); onDeleteTest?.(test.id); }}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Test Detail Modal */}
      <Modal
        open={!!detailTest}
        onClose={() => setDetailTest(null)}
        title={detailTest?.name || 'Test Detail'}
        description={`${detailTest?.targetFile} → ${detailTest?.targetFunction}`}
        size="xl"
      >
        {detailTest && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <CoverageRing coverage={detailTest.coverage} size={56} />
                <p className="text-xs text-fg-muted mt-1">Coverage</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-lg font-bold text-fg">{detailTest.mutationsSurvived}</p>
                <p className="text-xs text-fg-muted">Mutations Survived</p>
              </div>
              <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                <p className="text-lg font-bold text-fg">{detailTest.mutationsTotal}</p>
                <p className="text-xs text-fg-muted">Total Mutations</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-fg mb-2">Generated Test Code</h4>
              <CodePreview code={detailTest.code} />
            </div>

            {/* Mutation Results */}
            {testMutations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Mutation Testing Results</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {testMutations.map(mutation => (
                    <div
                      key={mutation.id}
                      className={cn(
                        'p-3 rounded-lg border',
                        mutation.killed ? 'bg-success/5 border-success/30' : 'bg-error/5 border-error/30'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={mutation.killed ? 'success' : 'error'} size="sm">
                          {mutation.killed ? 'Killed' : 'Survived'}
                        </Badge>
                        <span className="text-xs text-fg-muted">{mutationTypeLabel(mutation.mutationType)}</span>
                      </div>
                      <p className="text-xs text-fg">{mutation.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => onRunTests?.([detailTest.id])}>
                Run Test
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDeleteTest?.(detailTest.id)}>
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Config Modal */}
      <Modal
        open={showConfig}
        onClose={() => setShowConfig(false)}
        title="Test Generator Configuration"
        description="Configure AI test generation and mutation testing"
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <Switch
              label="Auto-Generate on Fix"
              description="Automatically generate tests when code is fixed"
              checked={config.autoGenerateOnFix}
              onChange={e => onConfigChange?.({ ...config, autoGenerateOnFix: e.target.checked })}
            />
            <Switch
              label="Mutation Testing"
              description="Run mutation tests to verify test quality"
              checked={config.enableMutationTesting}
              onChange={e => onConfigChange?.({ ...config, enableMutationTesting: e.target.checked })}
            />
            <Switch
              label="Include Edge Cases"
              description="Generate tests for boundary conditions and edge cases"
              checked={config.includeEdgeCases}
              onChange={e => onConfigChange?.({ ...config, includeEdgeCases: e.target.checked })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Test Framework</label>
            <Select
              options={[
                { value: 'jest', label: 'Jest' },
                { value: 'vitest', label: 'Vitest' },
                { value: 'mocha', label: 'Mocha' },
                { value: 'pytest', label: 'pytest' },
                { value: 'go-test', label: 'Go testing' },
                { value: 'junit', label: 'JUnit' },
              ]}
              value={config.testFramework}
              onChange={e => onConfigChange?.({ ...config, testFramework: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Minimum Coverage Target (%)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={config.minCoverage}
              onChange={e => onConfigChange?.({ ...config, minCoverage: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">Max Tests Per Function</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={config.maxTestsPerFunction}
              onChange={e => onConfigChange?.({ ...config, maxTestsPerFunction: parseInt(e.target.value) || 5 })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TestGenerator;

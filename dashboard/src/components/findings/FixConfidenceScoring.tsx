import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { cn } from '../../utils/cn';
import type { Finding, Severity } from '../../types';

interface ConfidenceFactors {
  codeComplexity: number;
  testCoverage: number;
  historicalAccuracy: number;
  patternMatch: number;
  contextRelevance: number;
}

interface ScoredFinding extends Finding {
  confidenceScore: number;
  factors: ConfidenceFactors;
  autoApproved: boolean;
  modelVersion: string;
}

interface FixConfidenceScoringProps {
  findings?: ScoredFinding[];
  autoApproveThreshold?: number;
  onThresholdChange?: (threshold: number) => void;
  onApprove?: (findingId: string) => void;
  onReject?: (findingId: string) => void;
}

const mockFindings: ScoredFinding[] = [
  {
    id: 'f1',
    repositoryId: 'repo1',
    runId: 'run1',
    category: 'BUG',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Null pointer dereference in user authentication',
    description: 'The authenticateUser function does not check for null response from the database layer, potentially causing a runtime crash.',
    filePath: 'src/auth/service.ts',
    lineStart: 45,
    lineEnd: 52,
    source: 'static-analysis',
    createdAt: '2026-06-28T10:30:00Z',
    confidenceScore: 0.94,
    factors: { codeComplexity: 0.85, testCoverage: 0.92, historicalAccuracy: 0.97, patternMatch: 0.95, contextRelevance: 0.96 },
    autoApproved: true,
    modelVersion: 'codepulse-v3.2',
    suggestedFix: 'Add null check before accessing response.user',
    codeSnippet: 'const user = response.user;\nreturn user.token;',
  },
  {
    id: 'f2',
    repositoryId: 'repo1',
    runId: 'run1',
    category: 'SECURITY',
    severity: 'CRITICAL',
    status: 'OPEN',
    title: 'SQL injection vulnerability in search endpoint',
    description: 'User input is directly concatenated into SQL query without sanitization or parameterized queries.',
    filePath: 'src/api/search.ts',
    lineStart: 112,
    lineEnd: 118,
    source: 'security-scanner',
    createdAt: '2026-06-28T10:30:00Z',
    confidenceScore: 0.98,
    factors: { codeComplexity: 0.90, testCoverage: 0.95, historicalAccuracy: 0.99, patternMatch: 0.99, contextRelevance: 0.97 },
    autoApproved: true,
    modelVersion: 'codepulse-v3.2',
    suggestedFix: 'Use parameterized queries with prepared statements',
    codeSnippet: 'const query = `SELECT * FROM users WHERE name = \'${userInput}\'`;',
  },
  {
    id: 'f3',
    repositoryId: 'repo1',
    runId: 'run1',
    category: 'PERFORMANCE',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'N+1 query pattern in user listing',
    description: 'The user listing endpoint triggers a separate database query for each user to fetch their profile data.',
    filePath: 'src/api/users.ts',
    lineStart: 78,
    lineEnd: 95,
    source: 'performance-analyzer',
    createdAt: '2026-06-28T10:30:00Z',
    confidenceScore: 0.87,
    factors: { codeComplexity: 0.75, testCoverage: 0.88, historicalAccuracy: 0.90, patternMatch: 0.92, contextRelevance: 0.85 },
    autoApproved: false,
    modelVersion: 'codepulse-v3.2',
    suggestedFix: 'Use JOIN or batch loading to fetch user profiles in a single query',
    codeSnippet: 'const users = await db.query("SELECT * FROM users");\nfor (const user of users) {\n  user.profile = await db.query("SELECT * FROM profiles WHERE user_id = ?", [user.id]);\n}',
  },
  {
    id: 'f4',
    repositoryId: 'repo1',
    runId: 'run1',
    category: 'REFACTOR',
    severity: 'LOW',
    status: 'OPEN',
    title: 'Duplicate validation logic across modules',
    description: 'Email validation logic is duplicated in 4 different modules instead of using a shared utility.',
    filePath: 'src/utils/validators.ts',
    lineStart: 15,
    lineEnd: 22,
    source: 'code-smell-detector',
    createdAt: '2026-06-28T10:30:00Z',
    confidenceScore: 0.72,
    factors: { codeComplexity: 0.60, testCoverage: 0.70, historicalAccuracy: 0.75, patternMatch: 0.80, contextRelevance: 0.73 },
    autoApproved: false,
    modelVersion: 'codepulse-v3.2',
    suggestedFix: 'Extract email validation into a shared utility function',
  },
  {
    id: 'f5',
    repositoryId: 'repo1',
    runId: 'run1',
    category: 'TYPE_SAFETY',
    severity: 'MEDIUM',
    status: 'OPEN',
    title: 'Implicit any type in API response handler',
    description: 'The response handler function uses implicit any type, bypassing TypeScript type checking.',
    filePath: 'src/handlers/response.ts',
    lineStart: 33,
    lineEnd: 40,
    source: 'typescript-compiler',
    createdAt: '2026-06-28T10:30:00Z',
    confidenceScore: 0.65,
    factors: { codeComplexity: 0.55, testCoverage: 0.60, historicalAccuracy: 0.70, patternMatch: 0.68, contextRelevance: 0.62 },
    autoApproved: false,
    modelVersion: 'codepulse-v3.2',
    suggestedFix: 'Add explicit type annotation for the response parameter',
  },
];

function getScoreColor(score: number): string {
  if (score >= 0.9) return 'text-green';
  if (score >= 0.75) return 'text-blue';
  if (score >= 0.6) return 'text-yellow';
  return 'text-red';
}

function getScoreBg(score: number): string {
  if (score >= 0.9) return 'bg-green/20';
  if (score >= 0.75) return 'bg-blue/20';
  if (score >= 0.6) return 'bg-yellow/20';
  return 'bg-red/20';
}

function getSeverityBadgeVariant(severity: Severity): 'error' | 'warning' | 'info' | 'default' {
  switch (severity) {
    case 'CRITICAL': return 'error';
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'info';
    default: return 'default';
  }
}

function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const color = value >= 0.85 ? 'bg-green' : value >= 0.65 ? 'bg-blue' : value >= 0.4 ? 'bg-yellow' : 'bg-red';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-fg-muted w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="text-xs text-fg w-10 text-right">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export function FixConfidenceScoring({
  findings = mockFindings,
  autoApproveThreshold = 0.9,
  onThresholdChange,
  onApprove,
  onReject,
}: FixConfidenceScoringProps) {
  const [threshold, setThreshold] = React.useState(autoApproveThreshold);
  const [autoApproveEnabled, setAutoApproveEnabled] = React.useState(true);
  const [selectedFinding, setSelectedFinding] = React.useState<ScoredFinding | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'auto' | 'manual'>('all');

  const handleThresholdChange = (value: number) => {
    setThreshold(value);
    onThresholdChange?.(value);
  };

  const filteredFindings = findings.filter(f => {
    if (filter === 'auto') return f.autoApproved;
    if (filter === 'manual') return !f.autoApproved;
    return true;
  });

  const autoApprovedCount = findings.filter(f => f.autoApproved).length;
  const avgConfidence = findings.reduce((sum, f) => sum + f.confidenceScore, 0) / findings.length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Total Scored</div>
          <div className="text-2xl font-bold text-fg">{findings.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Auto-Approved</div>
          <div className="text-2xl font-bold text-green">{autoApprovedCount}</div>
          <div className="text-xs text-fg-muted mt-1">{((autoApprovedCount / findings.length) * 100).toFixed(0)}% of total</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Avg Confidence</div>
          <div className={cn('text-2xl font-bold', getScoreColor(avgConfidence))}>{(avgConfidence * 100).toFixed(1)}%</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted mb-1">Model Version</div>
          <div className="text-sm font-medium text-fg mt-1">codepulse-v3.2</div>
          <div className="text-xs text-fg-muted mt-1">Last trained: 2h ago</div>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Confidence Threshold Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-fg">Auto-Approve High Confidence Fixes</div>
                <div className="text-xs text-fg-muted">Automatically approve fixes above the confidence threshold</div>
              </div>
              <Switch checked={autoApproveEnabled} onChange={() => setAutoApproveEnabled(!autoApproveEnabled)} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-fg">Approval Threshold</span>
                <span className={cn('text-sm font-bold', getScoreColor(threshold))}>{(threshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={threshold}
                onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-xs text-fg-muted mt-1">
                <span>50% (Aggressive)</span>
                <span>99% (Conservative)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg w-fit">
        {(['all', 'auto', 'manual'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              filter === tab ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
            )}
          >
            {tab === 'all' ? `All (${findings.length})` : tab === 'auto' ? `Auto-Approved (${autoApprovedCount})` : `Needs Review (${findings.length - autoApprovedCount})`}
          </button>
        ))}
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.map(finding => (
          <Card
            key={finding.id}
            hover
            className={cn(
              'cursor-pointer transition-all',
              finding.autoApproved && 'border-l-4 border-l-green'
            )}
            onClick={() => setSelectedFinding(finding)}
          >
            <CardContent>
              <div className="flex items-start gap-4">
                {/* Score Circle */}
                <div className={cn('w-14 h-14 rounded-full flex items-center justify-center shrink-0', getScoreBg(finding.confidenceScore))}>
                  <span className={cn('text-sm font-bold', getScoreColor(finding.confidenceScore))}>
                    {(finding.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityBadgeVariant(finding.severity)} size="sm">{finding.severity}</Badge>
                    <Badge variant="outline" size="sm">{finding.category}</Badge>
                    {finding.autoApproved && (
                      <Badge variant="success" size="sm" dot>Auto-Approved</Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-fg truncate">{finding.title}</h4>
                  <p className="text-xs text-fg-muted mt-1 line-clamp-2">{finding.description}</p>
                  {finding.filePath && (
                    <div className="text-xs text-fg-muted mt-2 font-mono">
                      {finding.filePath}:{finding.lineStart}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {!finding.autoApproved && (
                    <>
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onReject?.(finding.id); }}>
                        Reject
                      </Button>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); onApprove?.(finding.id); }}>
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedFinding(null)}>
          <div className="bg-bg-secondary border border-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', getScoreBg(selectedFinding.confidenceScore))}>
                  <span className={cn('text-sm font-bold', getScoreColor(selectedFinding.confidenceScore))}>
                    {(selectedFinding.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg">{selectedFinding.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getSeverityBadgeVariant(selectedFinding.severity)} size="sm">{selectedFinding.severity}</Badge>
                    <Badge variant="outline" size="sm">{selectedFinding.category}</Badge>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedFinding(null)} className="text-fg-muted hover:text-fg p-1">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 5l-10 10M5 5l10 10" /></svg>
              </button>
            </div>

            <p className="text-sm text-fg-muted mb-4">{selectedFinding.description}</p>

            {/* Confidence Factors */}
            <div className="bg-bg-tertiary rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-fg mb-3">Confidence Factors</h4>
              <div className="space-y-2">
                <ConfidenceBar value={selectedFinding.factors.codeComplexity} label="Code Complexity" />
                <ConfidenceBar value={selectedFinding.factors.testCoverage} label="Test Coverage" />
                <ConfidenceBar value={selectedFinding.factors.historicalAccuracy} label="Historical Accuracy" />
                <ConfidenceBar value={selectedFinding.factors.patternMatch} label="Pattern Match" />
                <ConfidenceBar value={selectedFinding.factors.contextRelevance} label="Context Relevance" />
              </div>
            </div>

            {/* Code Snippet */}
            {selectedFinding.codeSnippet && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-fg mb-2">Original Code</h4>
                <pre className="bg-bg-tertiary rounded-lg p-3 text-xs font-mono text-fg-muted overflow-x-auto">
                  {selectedFinding.codeSnippet}
                </pre>
              </div>
            )}

            {/* Suggested Fix */}
            {selectedFinding.suggestedFix && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-fg mb-2">Suggested Fix</h4>
                <div className="bg-green/10 border border-green/30 rounded-lg p-3 text-sm text-green">
                  {selectedFinding.suggestedFix}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-fg-muted">Model: {selectedFinding.modelVersion}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedFinding(null)}>Close</Button>
                {!selectedFinding.autoApproved && (
                  <>
                    <Button variant="danger" size="sm" onClick={() => { onReject?.(selectedFinding.id); setSelectedFinding(null); }}>Reject</Button>
                    <Button size="sm" onClick={() => { onApprove?.(selectedFinding.id); setSelectedFinding(null); }}>Approve Fix</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FixConfidenceScoring;

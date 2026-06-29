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

export type DiagramType = 'c4-context' | 'c4-container' | 'c4-component' | 'class' | 'sequence' | 'flowchart' | 'dependency';
export type DriftSeverity = 'none' | 'minor' | 'major' | 'critical';

export interface DiagramNode {
  id: string;
  label: string;
  type: string;
  description?: string;
  children?: DiagramNode[];
}

export interface DiagramEdge {
  source: string;
  target: string;
  label?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

export interface DriftFinding {
  id: string;
  severity: DriftSeverity;
  description: string;
  expectedMermaid: string;
  actualMermaid: string;
  affectedComponent: string;
  detectedAt: string;
}

export interface ArchitectureDiagram {
  id: string;
  name: string;
  type: DiagramType;
  mermaidCode: string;
  generatedAt: string;
  driftFindings: DriftFinding[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface ArchitectureVisualizerProps {
  diagrams?: ArchitectureDiagram[];
  generating?: boolean;
  onGenerate?: (type: DiagramType) => void;
  onRegenerate?: (id: string) => void;
  onDeleteDiagram?: (id: string) => void;
  onDetectDrift?: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function driftVariant(severity: DriftSeverity) {
  switch (severity) {
    case 'critical': return 'error';
    case 'major': return 'warning';
    case 'minor': return 'info';
    case 'none': return 'success';
  }
}

function driftLabel(severity: DriftSeverity) {
  switch (severity) {
    case 'critical': return 'Critical Drift';
    case 'major': return 'Major Drift';
    case 'minor': return 'Minor Drift';
    case 'none': return 'No Drift';
  }
}

function diagramTypeLabel(type: DiagramType): string {
  switch (type) {
    case 'c4-context': return 'C4 Context';
    case 'c4-container': return 'C4 Container';
    case 'c4-component': return 'C4 Component';
    case 'class': return 'Class Diagram';
    case 'sequence': return 'Sequence Diagram';
    case 'flowchart': return 'Flowchart';
    case 'dependency': return 'Dependency Graph';
  }
}

// ─── Components ──────────────────────────────────────────────────────────────

function MermaidPreview({ code, title }: { code: string; title?: string }) {
  const [viewMode, setViewMode] = useState<'rendered' | 'source'>('rendered');

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary border-b border-border">
        <span className="text-xs font-medium text-fg">{title || 'Diagram'}</span>
        <div className="flex items-center gap-1">
          <button
            className={cn(
              'px-2 py-0.5 text-xs rounded',
              viewMode === 'rendered' ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg'
            )}
            onClick={() => setViewMode('rendered')}
          >
            Visual
          </button>
          <button
            className={cn(
              'px-2 py-0.5 text-xs rounded',
              viewMode === 'source' ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg'
            )}
            onClick={() => setViewMode('source')}
          >
            Source
          </button>
        </div>
      </div>
      <div className="p-4 bg-bg-secondary min-h-[200px]">
        {viewMode === 'source' ? (
          <pre className="text-xs font-mono text-fg whitespace-pre-wrap">{code}</pre>
        ) : (
          <div className="flex items-center justify-center min-h-[200px] text-fg-muted">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <p className="text-sm">Mermaid diagram rendered here</p>
              <p className="text-xs mt-1 font-mono opacity-60">{code.split('\n')[0]}...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DriftIndicator({ findings }: { findings: DriftFinding[] }) {
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const majorCount = findings.filter(f => f.severity === 'major').length;
  const minorCount = findings.filter(f => f.severity === 'minor').length;

  return (
    <div className="flex items-center gap-2">
      {criticalCount > 0 && (
        <Badge variant="error" size="sm" dot>{criticalCount} Critical</Badge>
      )}
      {majorCount > 0 && (
        <Badge variant="warning" size="sm" dot>{majorCount} Major</Badge>
      )}
      {minorCount > 0 && (
        <Badge variant="info" size="sm" dot>{minorCount} Minor</Badge>
      )}
      {findings.length === 0 && (
        <Badge variant="success" size="sm" dot>In Sync</Badge>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ArchitectureVisualizer({
  diagrams = [],
  generating = false,
  onGenerate,
  onRegenerate,
  onDeleteDiagram,
  onDetectDrift,
}: ArchitectureVisualizerProps) {
  const [diagramType, setDiagramType] = useState<DiagramType>('c4-context');
  const [selectedDiagram, setSelectedDiagram] = useState<ArchitectureDiagram | null>(null);
  const [driftDiagram, setDriftDiagram] = useState<ArchitectureDiagram | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DiagramType | 'all'>('all');

  const filteredDiagrams = useMemo(() => {
    return diagrams.filter(d => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      return true;
    });
  }, [diagrams, search, typeFilter]);

  const stats = useMemo(() => {
    const totalDrift = diagrams.reduce((sum, d) => sum + d.driftFindings.length, 0);
    const criticalDrift = diagrams.reduce(
      (sum, d) => sum + d.driftFindings.filter(f => f.severity === 'critical').length, 0
    );
    return { total: diagrams.length, totalDrift, criticalDrift };
  }, [diagrams]);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-fg">{stats.total}</p>
          <p className="text-xs text-fg-muted">Diagrams</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className="text-2xl font-bold text-accent">{diagrams.reduce((sum, d) => sum + d.nodes.length, 0)}</p>
          <p className="text-xs text-fg-muted">Components</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className={cn('text-2xl font-bold', stats.totalDrift > 0 ? 'text-warning' : 'text-success')}>
            {stats.totalDrift}
          </p>
          <p className="text-xs text-fg-muted">Drift Findings</p>
        </Card>
        <Card variant="glass" padding="sm" className="text-center">
          <p className={cn('text-2xl font-bold', stats.criticalDrift > 0 ? 'text-error' : 'text-success')}>
            {stats.criticalDrift}
          </p>
          <p className="text-xs text-fg-muted">Critical Drift</p>
        </Card>
      </div>

      {/* Generate Controls */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-fg mb-1.5">Diagram Type</label>
            <Select
              options={[
                { value: 'c4-context', label: 'C4 Context (System Landscape)' },
                { value: 'c4-container', label: 'C4 Container (High-Level)' },
                { value: 'c4-component', label: 'C4 Component (Detailed)' },
                { value: 'class', label: 'Class Diagram' },
                { value: 'sequence', label: 'Sequence Diagram' },
                { value: 'flowchart', label: 'Flowchart' },
                { value: 'dependency', label: 'Dependency Graph' },
              ]}
              value={diagramType}
              onChange={e => setDiagramType(e.target.value as DiagramType)}
            />
          </div>
          <Button
            variant="primary"
            loading={generating}
            onClick={() => onGenerate?.(diagramType)}
          >
            {generating ? 'Generating...' : 'Generate Diagram'}
          </Button>
        </div>
      </Card>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="7" /><path d="M13 13l4 4" />
          </svg>
          <input
            type="text"
            placeholder="Search diagrams..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-fg placeholder-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>
        <Select
          options={[
            { value: 'all', label: 'All Types' },
            { value: 'c4-context', label: 'C4 Context' },
            { value: 'c4-container', label: 'C4 Container' },
            { value: 'c4-component', label: 'C4 Component' },
            { value: 'class', label: 'Class' },
            { value: 'sequence', label: 'Sequence' },
            { value: 'flowchart', label: 'Flowchart' },
            { value: 'dependency', label: 'Dependency' },
          ]}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as DiagramType | 'all')}
          className="w-full sm:w-44"
        />
      </div>

      {/* Diagrams Grid */}
      {filteredDiagrams.length === 0 ? (
        <Card padding="lg" className="text-center">
          <svg className="w-12 h-12 mx-auto text-fg-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <p className="text-fg font-medium">No diagrams generated yet</p>
          <p className="text-sm text-fg-muted mt-1">Generate architecture diagrams from your codebase automatically.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDiagrams.map(diagram => (
            <Card
              key={diagram.id}
              hover
              className="cursor-pointer"
              onClick={() => setSelectedDiagram(diagram)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{diagram.name}</CardTitle>
                    <CardDescription>
                      {diagramTypeLabel(diagram.type)} • {diagram.nodes.length} components • {diagram.edges.length} connections
                    </CardDescription>
                  </div>
                  <Badge variant="outline" size="sm">{diagram.type.split('-').pop()}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-bg-tertiary rounded-lg p-3 mb-3 min-h-[120px] flex items-center justify-center">
                  <span className="text-xs font-mono text-fg-muted">{diagram.mermaidCode.split('\n').slice(0, 3).join(' → ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <DriftIndicator findings={diagram.driftFindings} />
                  <span className="text-[10px] text-fg-muted">{diagram.generatedAt}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="xs" onClick={e => { e.stopPropagation(); onDetectDrift?.(diagram.id); }}>
                  Detect Drift
                </Button>
                <Button variant="ghost" size="xs" onClick={e => { e.stopPropagation(); onRegenerate?.(diagram.id); }}>
                  Regenerate
                </Button>
                <Button variant="ghost" size="xs" onClick={e => { e.stopPropagation(); onDeleteDiagram?.(diagram.id); }}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Diagram Detail Modal */}
      <Modal
        open={!!selectedDiagram}
        onClose={() => setSelectedDiagram(null)}
        title={selectedDiagram?.name || 'Architecture Diagram'}
        description={selectedDiagram ? diagramTypeLabel(selectedDiagram.type) : undefined}
        size="full"
      >
        {selectedDiagram && (
          <div className="space-y-4">
            <MermaidPreview code={selectedDiagram.mermaidCode} title={selectedDiagram.name} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Components ({selectedDiagram.nodes.length})</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedDiagram.nodes.map(node => (
                    <div key={node.id} className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <span className="text-xs font-mono text-fg">{node.label}</span>
                      <span className="text-[10px] text-fg-muted ml-auto">{node.type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Connections ({selectedDiagram.edges.length})</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedDiagram.edges.map((edge, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg">
                      <span className="text-xs font-mono text-fg truncate">{edge.source}</span>
                      <span className="text-fg-muted">→</span>
                      <span className="text-xs font-mono text-fg truncate">{edge.target}</span>
                      {edge.label && <span className="text-[10px] text-fg-muted ml-auto">{edge.label}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {selectedDiagram.driftFindings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-fg mb-2">Drift Findings</h4>
                <div className="space-y-2">
                  {selectedDiagram.driftFindings.map(finding => (
                    <div
                      key={finding.id}
                      className={cn(
                        'p-3 rounded-lg border',
                        finding.severity === 'critical' ? 'bg-error/5 border-error/30' :
                        finding.severity === 'major' ? 'bg-warning/5 border-warning/30' :
                        'bg-info/5 border-info/30'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={driftVariant(finding.severity)} size="sm">
                          {driftLabel(finding.severity)}
                        </Badge>
                        <span className="text-xs text-fg-muted">{finding.affectedComponent}</span>
                      </div>
                      <p className="text-xs text-fg">{finding.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => onRegenerate?.(selectedDiagram.id)}>
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDetectDrift?.(selectedDiagram.id)}>
                Detect Drift
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ArchitectureVisualizer;

import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import type { Finding, Severity } from '../../types';

interface FindingDetailDrawerProps {
  finding: Finding | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (id: string, status: string) => void;
}

export function FindingDetailDrawer({ finding, open, onClose, onStatusChange }: FindingDetailDrawerProps) {
  const [comment, setComment] = useState('');

  if (!finding) return null;

  const severityColors: Record<Severity, string> = {
    CRITICAL: 'bg-red/20 text-red border-red/30',
    HIGH: 'bg-orange/20 text-orange border-orange/30',
    MEDIUM: 'bg-yellow/20 text-yellow border-yellow/30',
    LOW: 'bg-blue/20 text-blue border-blue/30',
    INFO: 'bg-gray/20 text-gray border-gray/30',
  };

  return (
    <Modal open={open} onClose={onClose} title="Finding Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full border', severityColors[finding.severity])}>
                {finding.severity}
              </span>
              <span className="px-2 py-0.5 text-xs bg-bg-tertiary rounded-full">{finding.category}</span>
            </div>
            <h3 className="text-lg font-semibold text-fg">{finding.title}</h3>
            <p className="text-sm text-fg-muted mt-1">{finding.filePath}:{finding.lineStart ?? finding.lineNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-fg-muted">Confidence</p>
            <p className="text-lg font-mono text-fg">{finding.confidence}%</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-medium text-fg-muted mb-2">Description</h4>
          <p className="text-sm text-fg leading-relaxed">{finding.description}</p>
        </div>

        {/* Code Snippet */}
        {finding.codeSnippet && (
          <div>
            <h4 className="text-sm font-medium text-fg-muted mb-2">Code</h4>
            <pre className="p-4 bg-bg-secondary rounded-xl border border-border overflow-x-auto">
              <code className="text-sm font-mono text-fg">{finding.codeSnippet}</code>
            </pre>
          </div>
        )}

        {/* Suggested Fix */}
        {finding.suggestedFix && (
          <div>
            <h4 className="text-sm font-medium text-fg-muted mb-2">Suggested Fix</h4>
            <pre className="p-4 bg-green/5 rounded-xl border border-green/20 overflow-x-auto">
              <code className="text-sm font-mono text-green">{finding.suggestedFix}</code>
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Button variant="primary" size="sm">Accept Fix</Button>
          <Button variant="outline" size="sm">Modify Fix</Button>
          <Button variant="ghost" size="sm">Reject</Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        {/* Comments */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-fg-muted mb-3">Comments</h4>
          <div className="flex gap-3">
            <Avatar size="sm" fallback="U" />
            <div className="flex-1">
              <input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface TriageBoardProp {
  findings: Finding[];
  onFindingMove: (id: string, column: string) => void;
  onFindingClick: (finding: Finding) => void;
}

const TRIAGE_COLUMNS = [
  { id: 'new', label: 'New', color: 'bg-blue' },
  { id: 'triage', label: 'Triage', color: 'bg-yellow' },
  { id: 'fixing', label: 'Fixing', color: 'bg-orange' },
  { id: 'validated', label: 'Validated', color: 'bg-green' },
  { id: 'done', label: 'Done', color: 'bg-purple' },
];

export function TriageBoard({ findings, onFindingMove, onFindingClick }: TriageBoardProp) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const getColumnFindings = (columnId: string) => {
    return findings.filter(f => f.status === columnId);
  };

  return (
    <div className="grid grid-cols-5 gap-4 min-h-[500px]">
      {TRIAGE_COLUMNS.map(column => {
        const columnFindings = getColumnFindings(column.id);
        return (
          <div
            key={column.id}
            className="bg-bg-secondary rounded-xl border border-border p-3"
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              if (draggedId) onFindingMove(draggedId, column.id);
              setDraggedId(null);
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('w-2 h-2 rounded-full', column.color)} />
              <h4 className="text-sm font-medium text-fg">{column.label}</h4>
              <span className="ml-auto text-xs text-fg-muted bg-bg-tertiary px-2 py-0.5 rounded-full">
                {columnFindings.length}
              </span>
            </div>
            <div className="space-y-2">
              {columnFindings.map(finding => (
                <div
                  key={finding.id}
                  draggable
                  onDragStart={() => setDraggedId(finding.id)}
                  onClick={() => onFindingClick(finding)}
                  className="p-3 bg-bg-tertiary rounded-lg cursor-pointer hover:bg-bg-hover transition-colors border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-1.5 py-0.5 text-[10px] font-medium rounded-full', severityColor(finding.severity))}>
                      {finding.severity}
                    </span>
                  </div>
                  <p className="text-xs text-fg line-clamp-2">{finding.title}</p>
                  <p className="text-[10px] text-fg-muted mt-1">{finding.filePath?.split('/').pop()}:{finding.lineStart ?? finding.lineNumber}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function severityColor(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red/20 text-red';
    case 'HIGH': return 'bg-orange/20 text-orange';
    case 'MEDIUM': return 'bg-yellow/20 text-yellow';
    case 'LOW': return 'bg-blue/20 text-blue';
    default: return 'bg-gray/20 text-gray';
  }
}

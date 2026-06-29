import * as React from 'react';
import { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import type { Finding } from '../../types';

interface FixPreviewProp {
  finding: Finding | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onModify: (id: string, modifiedFix: string) => void;
}

export function FixPreview({ finding, onAccept, onReject, onModify }: FixPreviewProp) {
  const [modifiedFix, setModifiedFix] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!finding) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-border rounded-xl">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-fg-muted">Select a finding to preview its fix</p>
      </div>
    );
  }

  const fixText = finding.suggestedFix || 'No fix suggested';

  return (
    <div className="space-y-4">
      {/* Finding Summary */}
      <div className="p-4 bg-bg-secondary rounded-xl border border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', severityBg(finding.severity))}>
            {finding.severity}
          </span>
          <span className="text-xs px-2 py-0.5 bg-bg-tertiary rounded-full">{finding.category}</span>
        </div>
        <h3 className="text-sm font-medium text-fg">{finding.title}</h3>
        <p className="text-xs text-fg-muted mt-1">{finding.filePath}:{finding.lineStart ?? finding.lineNumber}</p>
      </div>

      {/* Diff View */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-fg-muted">Proposed Fix</h4>
          <Button variant="ghost" size="xs" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {/* Original */}
          <div>
            <p className="text-xs text-fg-muted mb-1">Original</p>
            <pre className="p-3 bg-red/5 border border-red/20 rounded-lg overflow-x-auto">
              <code className="text-xs font-mono text-fg">{finding.codeSnippet || '// No code available'}</code>
            </pre>
          </div>
          {/* Fixed */}
          <div>
            <p className="text-xs text-fg-muted mb-1">Fixed</p>
            {isEditing ? (
              <textarea
                value={modifiedFix || fixText}
                onChange={e => setModifiedFix(e.target.value)}
                className="w-full p-3 bg-green/5 border border-green/20 rounded-lg text-xs font-mono text-fg resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-accent"
              />
            ) : (
              <pre className="p-3 bg-green/5 border border-green/20 rounded-lg overflow-x-auto">
                <code className="text-xs font-mono text-green">{fixText}</code>
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button variant="primary" size="sm" onClick={() => onAccept(finding.id)}>
          Accept Fix
        </Button>
        <Button variant="outline" size="sm" onClick={() => {
          if (isEditing && modifiedFix) {
            onModify(finding.id, modifiedFix);
          }
          setIsEditing(!isEditing);
        }}>
          {isEditing ? 'Save Edit' : 'Modify'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onReject(finding.id)}>
          Reject
        </Button>
        <div className="flex-1" />
        <span className="text-xs text-fg-muted">Confidence: {finding.confidence || 'N/A'}%</span>
      </div>
    </div>
  );
}

function severityBg(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red/20 text-red';
    case 'HIGH': return 'bg-orange/20 text-orange';
    case 'MEDIUM': return 'bg-yellow/20 text-yellow';
    case 'LOW': return 'bg-blue/20 text-blue';
    default: return 'bg-gray/20 text-gray';
  }
}

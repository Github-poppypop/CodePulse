import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input, Label } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { Switch } from '../ui/Switch';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PolicyAction = 'allow' | 'deny' | 'warn' | 'require_approval';

export type AutonomyGate =
  | 'auto_fix_pr'
  | 'auto_merge'
  | 'auto_close_issue'
  | 'auto_comment'
  | 'auto_label'
  | 'auto_assign'
  | 'create_branch'
  | 'push_commits'
  | 'modify_settings'
  | 'install_sensors';

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  gate: AutonomyGate;
  action: PolicyAction;
  enabled: boolean;
  conditions: PolicyCondition[];
  priority: number;
}

export interface PolicyCondition {
  field: string;
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'gt' | 'lt' | 'contains';
  value: string | string[] | number;
}

export interface PolicyConfig {
  defaultAction: PolicyAction;
  rules: PolicyRule[];
  enforcementMode: 'strict' | 'advisory';
  auditLog: boolean;
  notifyOnDeny: boolean;
}

export interface PolicyAsCodeProps {
  config: PolicyConfig;
  regoCode: string;
  onConfigChange: (config: Partial<PolicyConfig>) => void;
  onRegoChange: (code: string) => void;
  onSave: () => Promise<void>;
  onValidate: () => Promise<ValidationResult>;
  loading?: boolean;
  className?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ line: number; message: string; severity: 'error' | 'warning' }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const gateLabels: Record<AutonomyGate, string> = {
  auto_fix_pr: 'Auto-create Fix PRs',
  auto_merge: 'Auto-merge PRs',
  auto_close_issue: 'Auto-close Issues',
  auto_comment: 'Auto-comment on PRs',
  auto_label: 'Auto-label Resources',
  auto_assign: 'Auto-assign Reviewers',
  create_branch: 'Create Branches',
  push_commits: 'Push Commits',
  modify_settings: 'Modify Settings',
  install_sensors: 'Install Sensors',
};

const gateDescriptions: Record<AutonomyGate, string> = {
  auto_fix_pr: 'Automatically create pull requests with suggested fixes',
  auto_merge: 'Automatically merge PRs that pass all checks',
  auto_close_issue: 'Close issues when linked findings are resolved',
  auto_comment: 'Post automated review comments on pull requests',
  auto_label: 'Apply labels to issues and PRs based on findings',
  auto_assign: 'Assign reviewers based on code ownership',
  create_branch: 'Create new branches for fix PRs',
  push_commits: 'Push commits to remote repositories',
  modify_settings: 'Change repository or organization settings',
  install_sensors: 'Install or update custom analysis sensors',
};

const actionConfig: Record<PolicyAction, { label: string; variant: 'success' | 'error' | 'warning' | 'info' }> = {
  allow: { label: 'Allow', variant: 'success' },
  deny: { label: 'Deny', variant: 'error' },
  warn: { label: 'Warn', variant: 'warning' },
  require_approval: { label: 'Require Approval', variant: 'info' },
};

const ALL_GATES: AutonomyGate[] = [
  'auto_fix_pr', 'auto_merge', 'auto_close_issue', 'auto_comment',
  'auto_label', 'auto_assign', 'create_branch', 'push_commits',
  'modify_settings', 'install_sensors',
];

const defaultRegoCode = `# CodePulse Autonomy Policy
# Rego/OPA policy for governing automated actions

package codepulse.autonomy

# Default: deny all automated actions
default allow := false
default deny := false
default warn := false
default require_approval := false

# Allow auto-fix PRs for low/medium severity
allow {
    input.action == "auto_fix_pr"
    input.severity in ["LOW", "MEDIUM"]
    input.confidence >= 0.8
}

# Deny auto-merge in strict mode
deny {
    input.action == "auto_merge"
    input.enforcement_mode == "strict"
}

# Warn on auto-close for critical findings
warn {
    input.action == "auto_close_issue"
    input.severity == "CRITICAL"
}

# Require approval for settings changes
require_approval {
    input.action == "modify_settings"
}

# Allow auto-commenting
allow {
    input.action == "auto_comment"
}

# Allow auto-labeling
allow {
    input.action == "auto_label"
}

# Helper: check if user has admin role
is_admin {
    input.user_role == "ADMIN"
}

# Admins can do anything
allow {
    is_admin
}
`;

// ─── Component ────────────────────────────────────────────────────────────────

export function PolicyAsCode({
  config,
  regoCode,
  onConfigChange,
  onRegoChange,
  onSave,
  onValidate,
  loading = false,
  className,
}: PolicyAsCodeProps) {
  const [activeTab, setActiveTab] = React.useState<'rules' | 'rego'>('rules');
  const [validation, setValidation] = React.useState<ValidationResult | null>(null);
  const [validating, setValidating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editRule, setEditRule] = React.useState<PolicyRule | null>(null);

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await onValidate();
      setValidation(result);
    } finally {
      setValidating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = (ruleId: string) => {
    const updatedRules = config.rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    onConfigChange({ rules: updatedRules });
  };

  const updateRuleAction = (ruleId: string, action: PolicyAction) => {
    const updatedRules = config.rules.map((r) =>
      r.id === ruleId ? { ...r, action } : r
    );
    onConfigChange({ rules: updatedRules });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-fg">Policy as Code</h2>
          <p className="text-sm text-fg-muted mt-0.5">
            Define autonomy gates using Rego/OPA policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            loading={validating}
          >
            Validate
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            loading={saving || loading}
          >
            Save Policy
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div
          className={cn(
            'p-4 rounded-lg border',
            validation.valid
              ? 'bg-success/5 border-success/30'
              : 'bg-error/5 border-error/30'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {validation.valid ? (
              <svg className="w-5 h-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            )}
            <span className={cn('text-sm font-medium', validation.valid ? 'text-success' : 'text-error')}>
              {validation.valid ? 'Policy is valid' : `${validation.errors.length} issue(s) found`}
            </span>
          </div>
          {validation.errors.length > 0 && (
            <div className="space-y-1 mt-2">
              {validation.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge
                    variant={err.severity === 'error' ? 'error' : 'warning'}
                    size="sm"
                  >
                    L{err.line}
                  </Badge>
                  <span className={err.severity === 'error' ? 'text-error' : 'text-warning'}>
                    {err.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
          <CardDescription>Configure default behavior and enforcement mode.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Default Action</Label>
              <Select
                value={config.defaultAction}
                onChange={(e) => onConfigChange({ defaultAction: e.target.value as PolicyAction })}
                options={[
                  { value: 'allow', label: 'Allow' },
                  { value: 'deny', label: 'Deny' },
                  { value: 'warn', label: 'Warn' },
                  { value: 'require_approval', label: 'Require Approval' },
                ]}
              />
            </div>
            <div>
              <Label>Enforcement Mode</Label>
              <Select
                value={config.enforcementMode}
                onChange={(e) => onConfigChange({ enforcementMode: e.target.value as 'strict' | 'advisory' })}
                options={[
                  { value: 'strict', label: 'Strict - Block violations' },
                  { value: 'advisory', label: 'Advisory - Log only' },
                ]}
              />
            </div>
          </div>
          <div className="space-y-3">
            <Switch
              label="Audit Logging"
              description="Log all policy decisions for compliance"
              checked={config.auditLog}
              onChange={(e) => onConfigChange({ auditLog: e.target.checked })}
            />
            <Switch
              label="Notify on Deny"
              description="Send notifications when actions are denied"
              checked={config.notifyOnDeny}
              onChange={(e) => onConfigChange({ notifyOnDeny: e.target.checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'rules'
              ? 'text-accent border-accent'
              : 'text-fg-muted border-transparent hover:text-fg'
          )}
        >
          Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rego')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'rego'
              ? 'text-accent border-accent'
              : 'text-fg-muted border-transparent hover:text-fg'
          )}
        >
          Rego Code
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' ? (
        <div className="space-y-3">
          {ALL_GATES.map((gate) => {
            const rule = config.rules.find((r) => r.gate === gate);
            const action = rule?.action ?? config.defaultAction;
            return (
              <div
                key={gate}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                  rule?.enabled ?? true
                    ? 'bg-bg-secondary border-border'
                    : 'bg-bg-secondary/50 border-border/50 opacity-60'
                )}
              >
                <Switch
                  checked={rule?.enabled ?? true}
                  onChange={() => rule && toggleRule(rule.id)}
                  label=""
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">
                      {gateLabels[gate]}
                    </span>
                    <Badge variant={actionConfig[action].variant} size="sm">
                      {actionConfig[action].label}
                    </Badge>
                  </div>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {gateDescriptions[gate]}
                  </p>
                </div>
                <Select
                  value={action}
                  onChange={(e) => rule && updateRuleAction(rule.id, e.target.value as PolicyAction)}
                  options={[
                    { value: 'allow', label: 'Allow' },
                    { value: 'deny', label: 'Deny' },
                    { value: 'warn', label: 'Warn' },
                    { value: 'require_approval', label: 'Require Approval' },
                  ]}
                  className="w-44"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Code Editor */}
          <div className="relative">
            <textarea
              value={regoCode}
              onChange={(e) => onRegoChange(e.target.value)}
              spellCheck={false}
              rows={24}
              className={cn(
                'w-full rounded-lg bg-bg-tertiary border border-border text-fg font-mono text-xs',
                'transition-all duration-150 px-4 py-3 resize-y leading-relaxed',
                'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
                'placeholder-fg-subtle'
              )}
            />
          </div>

          {/* Quick Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="font-medium text-fg mb-2">Available Inputs</h4>
                  <div className="space-y-1 font-mono text-fg-muted">
                    <p><span className="text-accent">input.action</span> - The action being evaluated</p>
                    <p><span className="text-accent">input.severity</span> - Finding severity level</p>
                    <p><span className="text-accent">input.confidence</span> - Confidence score (0-1)</p>
                    <p><span className="text-accent">input.user_role</span> - User's role</p>
                    <p><span className="text-accent">input.enforcement_mode</span> - Current mode</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-fg mb-2">Decision Rules</h4>
                  <div className="space-y-1 font-mono text-fg-muted">
                    <p><span className="text-success">allow</span> - Permit the action</p>
                    <p><span className="text-error">deny</span> - Block the action</p>
                    <p><span className="text-warning">warn</span> - Allow with warning</p>
                    <p><span className="text-info">require_approval</span> - Needs human review</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default PolicyAsCode;

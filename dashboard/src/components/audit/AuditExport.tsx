import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { cn } from '../../utils/cn';

interface AuditExportFormat {
  id: string;
  name: string;
  format: 'CSV' | 'PDF' | 'JSON';
  description: string;
  icon: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details: string;
  compliance: string[];
}

interface AttestationReport {
  id: string;
  type: 'SOC2' | 'ISO27001';
  period: string;
  generatedAt: string;
  signedBy: string;
  signature: string;
  status: 'VALID' | 'EXPIRED' | 'PENDING';
}

const exportFormats: AuditExportFormat[] = [
  { id: 'csv', name: 'CSV Export', format: 'CSV', description: 'Spreadsheet-compatible format for data analysis', icon: '📊' },
  { id: 'pdf', name: 'PDF Report', format: 'PDF', description: 'Formatted report with signatures for compliance review', icon: '📄' },
  { id: 'json', name: 'JSON Export', format: 'JSON', description: 'Machine-readable format for automated compliance systems', icon: '🔧' },
];

const mockAuditLogs: AuditLog[] = [
  { id: 'al1', timestamp: '2026-06-28T14:32:00Z', actor: 'alice@company.com', action: 'APPROVED_FIX', resource: 'finding_1234', details: 'Approved SQL injection fix for frontend-app', compliance: ['SOC2 CC6.1', 'ISO27001 A.12.1.2'] },
  { id: 'al2', timestamp: '2026-06-28T14:28:00Z', actor: 'bob@company.com', action: 'REJECTED_FIX', resource: 'finding_1235', details: 'Rejected null pointer fix - incorrect approach', compliance: ['SOC2 CC6.1'] },
  { id: 'al3', timestamp: '2026-06-28T13:15:00Z', actor: 'system', action: 'AUTO_APPROVED', resource: 'finding_1236', details: 'Auto-approved type annotation fix (confidence: 96%)', compliance: ['SOC2 CC6.1', 'SOC2 CC7.2'] },
  { id: 'al4', timestamp: '2026-06-28T12:00:00Z', actor: 'carol@company.com', action: 'EXPORT_AUDIT_LOG', resource: 'audit_q2_2026', details: 'Exported Q2 audit log for SOC2 review', compliance: ['SOC2 CC7.2', 'ISO27001 A.12.4.1'] },
  { id: 'al5', timestamp: '2026-06-28T11:45:00Z', actor: 'admin@company.com', action: 'MODIFIED_POLICY', resource: 'policy_auto_approve', details: 'Changed auto-approve threshold from 0.85 to 0.90', compliance: ['SOC2 CC5.2', 'ISO27001 A.12.1.2'] },
  { id: 'al6', timestamp: '2026-06-28T10:30:00Z', actor: 'system', action: 'RUN_COMPLETED', resource: 'run_789', details: 'Completed analysis run on api-service (8 findings)', compliance: ['SOC2 CC7.2'] },
  { id: 'al7', timestamp: '2026-06-28T09:00:00Z', actor: 'dave@company.com', action: 'ADDED_REPO', resource: 'repo_new_service', details: 'Registered new-service repository for monitoring', compliance: ['SOC2 CC6.1'] },
  { id: 'al8', timestamp: '2026-06-27T16:20:00Z', actor: 'alice@company.com', action: 'IGNORED_FINDING', resource: 'finding_1200', details: 'Marked low-priority style finding as wont-fix', compliance: ['SOC2 CC6.1'] },
];

const attestations: AttestationReport[] = [
  { id: 'att1', type: 'SOC2', period: 'Q2 2026', generatedAt: '2026-06-28T00:00:00Z', signedBy: 'CodePulse Security Team', signature: 'SHA256:a3f8b2...e4c9', status: 'VALID' },
  { id: 'att2', type: 'ISO27001', period: '2026 Audit Cycle', generatedAt: '2026-06-15T00:00:00Z', signedBy: 'External Auditor (Deloitte)', signature: 'SHA256:b7d1f4...a2e8', status: 'VALID' },
  { id: 'att3', type: 'SOC2', period: 'Q1 2026', generatedAt: '2026-03-31T00:00:00Z', signedBy: 'CodePulse Security Team', signature: 'SHA256:c2e5a1...f7b3', status: 'EXPIRED' },
];

const complianceFrameworks = [
  { value: 'all', label: 'All Frameworks' },
  { value: 'soc2', label: 'SOC 2 Type II' },
  { value: 'iso27001', label: 'ISO 27001' },
  { value: 'hipaa', label: 'HIPAA' },
  { value: 'gdpr', label: 'GDPR' },
];

const actionColors: Record<string, string> = {
  APPROVED_FIX: 'text-green',
  REJECTED_FIX: 'text-red',
  AUTO_APPROVED: 'text-blue',
  EXPORT_AUDIT_LOG: 'text-purple',
  MODIFIED_POLICY: 'text-yellow',
  RUN_COMPLETED: 'text-fg-muted',
  ADDED_REPO: 'text-accent',
  IGNORED_FINDING: 'text-orange',
};

export function AuditExport() {
  const [activeTab, setActiveTab] = React.useState<'export' | 'logs' | 'attestations'>('export');
  const [dateRange, setDateRange] = React.useState({ from: '2026-04-01', to: '2026-06-28' });
  const [selectedFramework, setSelectedFramework] = React.useState('all');
  const [selectedFormat, setSelectedFormat] = React.useState('csv');
  const [exporting, setExporting] = React.useState(false);
  const [filterAction, setFilterAction] = React.useState('all');

  const handleExport = (format: string) => {
    setExporting(true);
    setSelectedFormat(format);
    setTimeout(() => setExporting(false), 2000);
  };

  const filteredLogs = mockAuditLogs.filter(log => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (selectedFramework !== 'all' && !log.compliance.some(c => c.toLowerCase().includes(selectedFramework))) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fg">Audit & Compliance</h2>
          <p className="text-sm text-fg-muted mt-1">SOC2/ISO27001 ready exports with signed attestations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" dot>Compliant</Badge>
          <Badge variant="outline">SOC2 Type II</Badge>
          <Badge variant="outline">ISO27001</Badge>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green/20 rounded-lg flex items-center justify-center">
              <span className="text-green text-lg">✓</span>
            </div>
            <div>
              <div className="text-sm font-medium text-fg">SOC 2 Type II</div>
              <div className="text-xs text-green">Current • Valid until Dec 2026</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green/20 rounded-lg flex items-center justify-center">
              <span className="text-green text-lg">✓</span>
            </div>
            <div>
              <div className="text-sm font-medium text-fg">ISO 27001</div>
              <div className="text-xs text-green">Current • Valid until Mar 2027</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue/20 rounded-lg flex items-center justify-center">
              <span className="text-blue text-lg">↻</span>
            </div>
            <div>
              <div className="text-sm font-medium text-fg">Last Audit</div>
              <div className="text-xs text-fg-muted">June 28, 2026 • 8 events</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg w-fit">
        {(['export', 'logs', 'attestations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize',
              activeTab === tab ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:text-fg hover:bg-bg-hover'
            )}
          >
            {tab === 'export' ? 'Export' : tab === 'logs' ? 'Audit Logs' : 'Attestations'}
          </button>
        ))}
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-fg mb-1.5">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.from}
                      onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                      className="flex-1 rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                      className="flex-1 rounded-lg bg-bg-tertiary border border-border text-fg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <Select
                  label="Compliance Framework"
                  options={complianceFrameworks}
                  value={selectedFramework}
                  onChange={e => setSelectedFramework(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exportFormats.map(format => (
              <Card key={format.id} hover className={cn('cursor-pointer', selectedFormat === format.id && 'border-accent')}>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl mb-3">{format.icon}</div>
                    <h4 className="text-sm font-medium text-fg mb-1">{format.name}</h4>
                    <p className="text-xs text-fg-muted mb-4">{format.description}</p>
                    <Button
                      size="sm"
                      variant={selectedFormat === format.id ? 'primary' : 'outline'}
                      fullWidth
                      loading={exporting && selectedFormat === format.id}
                      onClick={() => handleExport(format.id)}
                    >
                      {exporting && selectedFormat === format.id ? 'Exporting...' : `Export ${format.format}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: 'audit_log_q2_2026.csv', format: 'CSV', size: '2.4 MB', date: '2026-06-28 14:30' },
                  { name: 'soc2_attestation_june.pdf', format: 'PDF', size: '890 KB', date: '2026-06-28 00:00' },
                  { name: 'full_export_2026-06-27.json', format: 'JSON', size: '5.1 MB', date: '2026-06-27 16:20' },
                  { name: 'audit_log_q1_2026.csv', format: 'CSV', size: '1.8 MB', date: '2026-03-31 12:00' },
                ].map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={file.format === 'CSV' ? 'success' : file.format === 'PDF' ? 'error' : 'info'} size="sm">
                        {file.format}
                      </Badge>
                      <span className="text-sm text-fg font-mono">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-fg-muted">{file.size}</span>
                      <span className="text-xs text-fg-muted">{file.date}</span>
                      <Button size="xs" variant="ghost">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <Select
              label="Action Filter"
              options={[
                { value: 'all', label: 'All Actions' },
                { value: 'APPROVED_FIX', label: 'Approved Fix' },
                { value: 'REJECTED_FIX', label: 'Rejected Fix' },
                { value: 'AUTO_APPROVED', label: 'Auto Approved' },
                { value: 'MODIFIED_POLICY', label: 'Modified Policy' },
                { value: 'EXPORT_AUDIT_LOG', label: 'Export Audit Log' },
              ]}
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
            />
            <Select
              label="Framework"
              options={complianceFrameworks}
              value={selectedFramework}
              onChange={e => setSelectedFramework(e.target.value)}
            />
          </div>

          <Card>
            <CardContent padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Timestamp</th>
                      <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Actor</th>
                      <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Action</th>
                      <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Resource</th>
                      <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Details</th>
                      <th className="text-left py-3 px-4 text-xs text-fg-muted font-medium">Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-bg-hover">
                        <td className="py-3 px-4 text-xs text-fg-muted font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs text-fg">{log.actor}</td>
                        <td className="py-3 px-4">
                          <span className={cn('text-xs font-medium', actionColors[log.action] || 'text-fg')}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-fg-muted">{log.resource}</td>
                        <td className="py-3 px-4 text-xs text-fg-muted max-w-[200px] truncate">{log.details}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            {log.compliance.map(c => (
                              <Badge key={c} variant="outline" size="sm">{c.split(' ')[0]}</Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attestations Tab */}
      {activeTab === 'attestations' && (
        <div className="space-y-4">
          {attestations.map(att => (
            <Card key={att.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center text-lg',
                      att.status === 'VALID' ? 'bg-green/20' : att.status === 'EXPIRED' ? 'bg-red/20' : 'bg-yellow/20'
                    )}>
                      {att.status === 'VALID' ? '✓' : att.status === 'EXPIRED' ? '✗' : '⏳'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-fg">{att.type}</h4>
                        <Badge
                          variant={att.status === 'VALID' ? 'success' : att.status === 'EXPIRED' ? 'error' : 'warning'}
                          size="sm"
                        >
                          {att.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-fg-muted mt-1">Period: {att.period}</div>
                      <div className="text-xs text-fg-muted mt-1">Generated: {new Date(att.generatedAt).toLocaleDateString()}</div>
                      <div className="text-xs text-fg-muted mt-1">Signed by: {att.signedBy}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-fg-muted">Signature:</span>
                        <code className="text-xs bg-bg-tertiary px-2 py-0.5 rounded font-mono text-fg-muted">{att.signature}</code>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Verify</Button>
                    <Button size="sm" variant="ghost">Download</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle>Generate New Attestation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <Select
                  label="Framework"
                  options={[
                    { value: 'soc2', label: 'SOC 2 Type II' },
                    { value: 'iso27001', label: 'ISO 27001' },
                  ]}
                  defaultValue="soc2"
                />
                <Select
                  label="Period"
                  options={[
                    { value: 'q2_2026', label: 'Q2 2026' },
                    { value: 'h1_2026', label: 'H1 2026' },
                    { value: '2026', label: 'Full Year 2026' },
                  ]}
                  defaultValue="q2_2026"
                />
                <Button>Generate & Sign</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AuditExport;

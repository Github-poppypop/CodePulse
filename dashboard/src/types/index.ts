export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type RunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type FindingCategory = 'BUG' | 'PERFORMANCE' | 'SECURITY' | 'STYLE' | 'REFACTOR' | 'TEST' | 'DOCUMENTATION' | 'TYPE_SAFETY' | 'DEPENDENCY';
export type FindingStatus = 'OPEN' | 'FIXED' | 'IGNORED' | 'IN_PROGRESS' | 'WONT_FIX';

export interface Repository {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  url: string;
  branch: string;
  languages?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    findings: number;
    runs: number;
  };
  lastRun?: {
    id: string;
    status: RunStatus;
    startedAt: string;
    completedAt: string | null;
  };
}

export interface Run {
  id: string;
  repositoryId: string;
  status: RunStatus;
  startedAt: string;
  completedAt: string | null;
  trigger: string;
  commitSha: string | null;
  branch: string | null;
}

export interface Finding {
  id: string;
  repositoryId: string;
  runId: string | null;
  category: FindingCategory;
  severity: Severity;
  status: FindingStatus;
  title: string;
  description: string;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  lineNumber?: number;
  source: string;
  createdAt: string;
  confidence?: number;
  codeSnippet?: string;
  suggestedFix?: string;
}

// Missing types from imports
export interface WebhookDelivery {
  id: string;
  repositoryId: string;
  event: string;
  payload: unknown;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  responseCode?: number;
  responseBody?: string;
  createdAt: string;
  attempts: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  private: boolean;
  default_branch: string;
  permissions: { admin: boolean; push: boolean; pull: boolean };
  updated_at: string;
}

export interface GitHubBranchesResponse {
  branches: Array<{ name: string; commit: { sha: string; url: string }; protected: boolean }>;
}

export interface GitHubLanguagesResponse {
  languages: Record<string, number>;
}

export interface AggregateStats {
  totalRepos: number;
  totalFindings: number;
  totalRuns: number;
  fixRate: number;
  avgRunTime: number;
  findingsBySeverity: Record<Severity, number>;
  findingsByCategory: Record<string, number>;
  runsByStatus: Record<string, number>;
}

export interface RepoComparisonRow {
  repositoryId: string;
  repoName: string;
  owner: string;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  totalRuns: number;
  lastRunStatus: RunStatus | null;
  lastRunAt: string | null;
  fixRate: number;
}

export interface GlobalFinding {
  id: string;
  repositoryId: string;
  repositoryName: string;
  repositoryOwner: string;
  runId: string | null;
  category: FindingCategory;
  severity: Severity;
  status: FindingStatus;
  title: string;
  description: string;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  source: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RepositoryFilters {
  search?: string;
  status?: RunStatus | 'all';
  severity?: Severity | 'all';
  language?: string;
  sortBy?: 'updatedAt' | 'name' | 'lastRun' | 'findings';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface RunFilters {
  repositoryId?: string;
  status?: RunStatus | 'all';
  trigger?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'startedAt' | 'completedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface FindingFilters {
  repositoryId?: string;
  runId?: string;
  category?: FindingCategory | 'all';
  severity?: Severity | 'all';
  status?: FindingStatus | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'severity' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
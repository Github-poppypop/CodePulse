import type {
  Repository,
  Run,
  Finding,
  WebhookDelivery,
  GitHubRepo,
  GitHubBranchesResponse,
  GitHubLanguagesResponse,
  AggregateStats,
  RepoComparisonRow,
  GlobalFinding,
  PaginatedResponse,
  RepositoryFilters,
  RunFilters,
  FindingFilters,
} from '../types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const reposApi = {
  list: (filters?: RepositoryFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return fetchApi<PaginatedResponse<Repository>>(`/repos?${params.toString()}`);
  },

  get: (id: string) => fetchApi<Repository>(`/repos/${id}`),

  create: (data: { githubId: number; branch?: string }) =>
    fetchApi<Repository>('/repos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Repository>) =>
    fetchApi<Repository>(`/repos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<void>(`/repos/${id}`, { method: 'DELETE' }),

  getRuns: (repoId: string, filters?: RunFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return fetchApi<PaginatedResponse<Run>>(`/repos/${repoId}/runs?${params.toString()}`);
  },

  getBranches: (repoId: string) =>
    fetchApi<string[]>(`/repos/${repoId}/branches`),

  getLanguages: (repoId: string) =>
    fetchApi<Record<string, number>>(`/repos/${repoId}/languages`),

  getWebhookDeliveries: (repoId: string) =>
    fetchApi<WebhookDelivery[]>(`/repos/${repoId}/webhooks/deliveries`),

  testWebhook: (repoId: string) =>
    fetchApi<{ success: boolean; deliveryId: string }>(`/repos/${repoId}/webhooks/test`, {
      method: 'POST',
    }),

  triggerRun: (repoId: string, branch?: string) =>
    fetchApi<Run>(`/repos/${repoId}/runs`, {
      method: 'POST',
      body: JSON.stringify({ branch }),
    }),
};

export const runsApi = {
  list: (filters?: RunFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return fetchApi<PaginatedResponse<Run>>(`/runs?${params.toString()}`);
  },

  get: (id: string) => fetchApi<Run>(`/runs/${id}`),

  getLogs: (id: string) =>
    fetchApi<{ logs: string }>(`/runs/${id}/logs`),

  cancel: (id: string) =>
    fetchApi<Run>(`/runs/${id}/cancel`, { method: 'POST' }),

  retry: (id: string) =>
    fetchApi<Run>(`/runs/${id}/retry`, { method: 'POST' }),
};

export const findingsApi = {
  list: (filters?: FindingFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    return fetchApi<PaginatedResponse<Finding>>(`/findings?${params.toString()}`);
  },

  get: (id: string) => fetchApi<Finding>(`/findings/${id}`),

  updateStatus: (id: string, status: Finding['status']) =>
    fetchApi<Finding>(`/findings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  bulkUpdateStatus: (ids: string[], status: Finding['status']) =>
    fetchApi<void>('/findings/bulk', {
      method: 'PATCH',
      body: JSON.stringify({ ids, status }),
    }),
};

export const githubApi = {
  getUserRepos: (token: string) =>
    fetchApi<GitHubRepo[]>('/github/repos', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getRepoBranches: (token: string, owner: string, repo: string) =>
    fetchApi<GitHubBranchesResponse>(`/github/repos/${owner}/${repo}/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getRepoLanguages: (token: string, owner: string, repo: string) =>
    fetchApi<GitHubLanguagesResponse>(`/github/repos/${owner}/${repo}/languages`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createWebhook: (token: string, owner: string, repo: string, webhookUrl: string, secret: string) =>
    fetchApi<{ id: number }>(`/github/repos/${owner}/${repo}/webhooks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url: webhookUrl, secret }),
    }),
};

export const dashboardApi = {
  getAggregateStats: () => fetchApi<AggregateStats>('/dashboard/stats'),

  getRepoComparison: () => fetchApi<RepoComparisonRow[]>('/dashboard/comparison'),

  getGlobalFindings: (limit?: number, severity?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (severity) params.append('severity', severity);
    return fetchApi<GlobalFinding[]>(`/dashboard/findings?${params.toString()}`);
  },
};

export const onboardingApi = {
  initiateOAuth: () => fetchApi<{ url: string; state: string }>('/github/oauth/initiate'),

  completeOAuth: (code: string, state: string) =>
    fetchApi<{ token: string; user: { login: string; avatar_url: string } }>('/github/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),

  getInstallations: (token: string) =>
    fetchApi<Array<{ id: number; account: { login: string; avatar_url: string }; repositories_url: string }>>(
      '/github/installations',
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  getInstallationRepos: (token: string, installationId: number) =>
    fetchApi<GitHubRepo[]>(`/github/installations/${installationId}/repos`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
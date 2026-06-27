import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import type {
  Repository,
  Run,
  Finding,
  WebhookDelivery,
  AggregateStats,
  RepoComparisonRow,
  GlobalFinding,
  RepositoryFilters,
  RunFilters,
  FindingFilters,
  PaginatedResponse,
  GitHubRepo,
} from '../types';

export function useRepositories(filters?: RepositoryFilters) {
  return useQuery({
    queryKey: ['repos', filters],
    queryFn: () => api.reposApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useRepository(id: string) {
  return useQuery({
    queryKey: ['repo', id],
    queryFn: () => api.reposApi.get(id),
    enabled: !!id,
  });
}

export function useRepositoryRuns(repoId: string, filters?: RunFilters) {
  return useQuery({
    queryKey: ['repo-runs', repoId, filters],
    queryFn: () => api.reposApi.getRuns(repoId, filters),
    enabled: !!repoId,
    placeholderData: (prev) => prev,
  });
}

export function useRepositoryBranches(repoId: string) {
  return useQuery({
    queryKey: ['repo-branches', repoId],
    queryFn: () => api.reposApi.getBranches(repoId),
    enabled: !!repoId,
  });
}

export function useRepositoryLanguages(repoId: string) {
  return useQuery({
    queryKey: ['repo-languages', repoId],
    queryFn: () => api.reposApi.getLanguages(repoId),
    enabled: !!repoId,
  });
}

export function useRepositoryWebhookDeliveries(repoId: string) {
  return useQuery({
    queryKey: ['repo-webhook-deliveries', repoId],
    queryFn: () => api.reposApi.getWebhookDeliveries(repoId),
    enabled: !!repoId,
  });
}

export function useRuns(filters?: RunFilters) {
  return useQuery({
    queryKey: ['runs', filters],
    queryFn: () => api.runsApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useRun(id: string) {
  return useQuery({
    queryKey: ['run', id],
    queryFn: () => api.runsApi.get(id),
    enabled: !!id,
  });
}

export function useRunLogs(id: string) {
  return useQuery({
    queryKey: ['run-logs', id],
    queryFn: () => api.runsApi.getLogs(id),
    enabled: !!id,
  });
}

export function useFindings(filters?: FindingFilters) {
  return useQuery({
    queryKey: ['findings', filters],
    queryFn: () => api.findingsApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useFinding(id: string) {
  return useQuery({
    queryKey: ['finding', id],
    queryFn: () => api.findingsApi.get(id),
    enabled: !!id,
  });
}

export function useAggregateStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboardApi.getAggregateStats(),
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRepoComparison() {
  return useQuery({
    queryKey: ['repo-comparison'],
    queryFn: () => api.dashboardApi.getRepoComparison(),
    refetchInterval: 1000 * 60 * 5,
  });
}

export function useGlobalFindings(limit?: number, severity?: string) {
  return useQuery({
    queryKey: ['global-findings', limit, severity],
    queryFn: () => api.dashboardApi.getGlobalFindings(limit, severity),
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateRepository() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { githubId: number; branch?: string }) => api.reposApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    },
  });
}

export function useUpdateRepository() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Repository> }) => api.reposApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
      queryClient.invalidateQueries({ queryKey: ['repo', id] });
    },
  });
}

export function useDeleteRepository() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.reposApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    },
  });
}

export function useTriggerRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ repoId, branch }: { repoId: string; branch?: string }) => api.reposApi.triggerRun(repoId, branch),
    onSuccess: (_, { repoId }) => {
      queryClient.invalidateQueries({ queryKey: ['repo-runs', repoId] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
      queryClient.invalidateQueries({ queryKey: ['repo', repoId] });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (repoId: string) => api.reposApi.testWebhook(repoId),
  });
}

export function useCancelRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.runsApi.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['run', id] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useRetryRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.runsApi.retry(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['run', id] });
      queryClient.invalidateQueries({ queryKey: ['runs'] });
    },
  });
}

export function useUpdateFindingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Finding['status'] }) => api.findingsApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['finding', id] });
      queryClient.invalidateQueries({ queryKey: ['findings'] });
    },
  });
}

export function useBulkUpdateFindingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: Finding['status'] }) => api.findingsApi.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
    },
  });
}

export function useGitHubUserRepos(token: string) {
  return useQuery({
    queryKey: ['github-repos', token],
    queryFn: () => api.githubApi.getUserRepos(token),
    enabled: !!token,
  });
}

export function useGitHubRepoBranches(token: string, owner: string, repo: string) {
  return useQuery({
    queryKey: ['github-repo-branches', token, owner, repo],
    queryFn: () => api.githubApi.getRepoBranches(token, owner, repo),
    enabled: !!token && !!owner && !!repo,
  });
}

export function useGitHubRepoLanguages(token: string, owner: string, repo: string) {
  return useQuery({
    queryKey: ['github-repo-languages', token, owner, repo],
    queryFn: () => api.githubApi.getRepoLanguages(token, owner, repo),
    enabled: !!token && !!owner && !!repo,
  });
}

export function useOnboardingInitiateOAuth() {
  return useMutation({
    mutationFn: () => api.onboardingApi.initiateOAuth(),
  });
}

export function useOnboardingCompleteOAuth() {
  return useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) => api.onboardingApi.completeOAuth(code, state),
  });
}

export function useOnboardingGetInstallations(token: string) {
  return useQuery({
    queryKey: ['github-installations', token],
    queryFn: () => api.onboardingApi.getInstallations(token),
    enabled: !!token,
  });
}

export function useOnboardingGetInstallationRepos(token: string, installationId: number) {
  return useQuery({
    queryKey: ['github-installation-repos', token, installationId],
    queryFn: () => api.onboardingApi.getInstallationRepos(token, installationId),
    enabled: !!token && !!installationId,
  });
}
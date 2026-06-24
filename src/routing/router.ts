export type TaskKind =
  | 'sensor'
  | 'diagnostics'
  | 'implementation'
  | 'review'
  | 'experiment';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type CostTier = 'low' | 'medium' | 'high';

export interface TaskProfile {
  kind: TaskKind;
  risk: RiskLevel;
  expectedCostTier?: CostTier;
  complexity?: 'simple' | 'moderate' | 'complex';
  contextSize?: 'small' | 'medium' | 'large';
}

export interface ModelOption {
  id: string;
  provider: string;
  costTier: CostTier;
  contextWindow: number;
  strengths: TaskKind[];
  riskTolerance: RiskLevel[];
  description: string;
}

const MODELS: ModelOption[] = [
  {
    id: 'gpt-4o',
    provider: 'openai',
    costTier: 'medium',
    contextWindow: 128000,
    strengths: ['diagnostics', 'review', 'implementation'],
    riskTolerance: ['low', 'medium', 'high'],
    description: 'Balanced GPT-4 class model for general tasks',
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    costTier: 'low',
    contextWindow: 128000,
    strengths: ['sensor', 'experiment', 'diagnostics'],
    riskTolerance: ['low', 'medium'],
    description: 'Cost-effective mini model for routine analysis',
  },
  {
    id: 'o3',
    provider: 'openai',
    costTier: 'high',
    contextWindow: 200000,
    strengths: ['implementation', 'diagnostics', 'review'],
    riskTolerance: ['high', 'critical'],
    description: 'Advanced reasoning model for complex or critical work',
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
    costTier: 'medium',
    contextWindow: 200000,
    strengths: ['review', 'implementation', 'diagnostics'],
    riskTolerance: ['low', 'medium', 'high', 'critical'],
    description: 'Claude Sonnet for deep code review and implementation',
  },
  {
    id: 'claude-opus-4-0-20250514',
    provider: 'anthropic',
    costTier: 'high',
    contextWindow: 200000,
    strengths: ['implementation', 'review'],
    riskTolerance: ['critical'],
    description: 'Most capable Claude model for critical implementations',
  },
  {
    id: 'claude-haiku-4-5-20250929',
    provider: 'anthropic',
    costTier: 'low',
    contextWindow: 200000,
    strengths: ['sensor', 'diagnostics'],
    riskTolerance: ['low', 'medium'],
    description: 'Fast, cheap Haiku for high-volume sensor analysis',
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'google',
    costTier: 'low',
    contextWindow: 1000000,
    strengths: ['sensor', 'experiment'],
    riskTolerance: ['low', 'medium'],
    description: 'Low-cost Google model for large-scale analysis',
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'google',
    costTier: 'medium',
    contextWindow: 1000000,
    strengths: ['diagnostics', 'review', 'implementation'],
    riskTolerance: ['medium', 'high'],
    description: 'Google Pro for balanced reasoning tasks',
  },
];

export interface ModelSelection {
  model: string;
  provider: string;
  reason: string;
  score: number;
}

function scoreTaskAffinity(model: ModelOption, task: TaskProfile): number {
  if (model.strengths.includes(task.kind)) {
    return 3;
  }
  return 0;
}

function scoreRiskAlignment(model: ModelOption, risk: RiskLevel): number {
  const riskRank: Record<RiskLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  const requiredRank = riskRank[risk];
  const modelMaxRisk = Math.max(...model.riskTolerance.map((r) => riskRank[r]));
  if (modelMaxRisk >= requiredRank) {
    return requiredRank;
  }
  return -Infinity;
}

function scoreCostEfficiency(model: ModelOption, task: TaskProfile): number {
  if (task.expectedCostTier && task.expectedCostTier !== model.costTier) {
    return -1;
  }
  if (task.complexity === 'simple' && model.costTier !== 'low') {
    return -0.5;
  }
  if (task.complexity === 'complex' && model.costTier === 'low') {
    return -0.5;
  }
  switch (model.costTier) {
    case 'low':
      return 2;
    case 'medium':
      return 1;
    case 'high':
      return 0;
    default:
      return 0;
  }
}

function scoreContextFit(model: ModelOption, contextSize: TaskProfile['contextSize']): number {
  if (!contextSize || contextSize === 'small') {
    return 1;
  }
  const sizeToTokens: Record<string, number> = {
    small: 4000,
    medium: 50000,
    large: 200000,
  };
  const required = sizeToTokens[contextSize] ?? 4000;
  if (model.contextWindow >= required) {
    return 1;
  }
  return -Infinity;
}

export function selectModel(task: TaskProfile): ModelSelection {
  const baseProvider =
    typeof process !== 'undefined' && process.env?.DEFAULT_MODEL_PROVIDER
      ? process.env.DEFAULT_MODEL_PROVIDER.toLowerCase()
      : 'openai';

  const preferredProviderModels = MODELS.filter((m) => m.provider === baseProvider);
  const candidates = preferredProviderModels.length > 0 ? preferredProviderModels : MODELS;

  let best: { model: string; provider: string; reason: string; score: number } | undefined;

  for (const model of candidates) {
    const taskScore = scoreTaskAffinity(model, task);
    const riskScore = scoreRiskAlignment(model, task.risk);
    const costScore = scoreCostEfficiency(model, task);
    const contextScore = scoreContextFit(model, task.contextSize ?? 'small');

    if (!Number.isFinite(riskScore) || !Number.isFinite(contextScore)) {
      continue;
    }

    const total = taskScore + riskScore + costScore + contextScore;

    if (!best || total > best.score) {
      const reasons: string[] = [];
      if (taskScore > 0) reasons.push('task affinity');
      if (costScore > 0) reasons.push('cost efficient');
      if (contextScore > 0) reasons.push('context fit');

      best = {
        model: model.id,
        provider: model.provider,
        reason: reasons.join(', ') || 'fallback candidate',
        score: total,
      };
    }
  }

  if (!best) {
    return {
      model: process.env?.DEFAULT_MODEL ?? 'gpt-4o',
      provider: baseProvider,
      reason: 'no selective match; using default fallback',
      score: -Infinity,
    };
  }

  return best;
}

export function listModels(): readonly ModelOption[] {
  return MODELS;
}

import {
  LLMProvider,
  ProviderConfig,
  ProviderType,
  LLMMessage,
  LLMOptions,
  LLMResponse,
} from "./providers";
import { OpenRouterProvider } from "./openrouter";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { LocalProvider } from "./local";

export class LLMRouter {
  private providers: Map<ProviderType, LLMProvider> = new Map();
  private defaultProvider: ProviderType = "openrouter";

  constructor(configs: Partial<Record<ProviderType, ProviderConfig>> = {}) {
    if (configs.openrouter) {
      this.providers.set(
        "openrouter",
        new OpenRouterProvider(configs.openrouter),
      );
    }
    if (configs.anthropic) {
      this.providers.set("anthropic", new AnthropicProvider(configs.anthropic));
    }
    if (configs.openai) {
      this.providers.set("openai", new OpenAIProvider(configs.openai));
    }
    if (configs.local) {
      this.providers.set("local", new LocalProvider(configs.local));
    }
  }

  setDefaultProvider(type: ProviderType) {
    if (this.providers.has(type)) {
      this.defaultProvider = type;
    }
  }

  getProvider(type?: ProviderType): LLMProvider {
    const providerType = type || this.defaultProvider;
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not configured`);
    }
    return provider;
  }

  async chat(
    messages: LLMMessage[],
    options: LLMOptions & { provider?: ProviderType } = {},
  ): Promise<LLMResponse> {
    const provider = this.getProvider(options.provider);
    return provider.chat(messages, options);
  }

  async *streamChat(
    messages: LLMMessage[],
    options: LLMOptions & { provider?: ProviderType } = {},
  ): AsyncGenerator<LLMResponse, void, unknown> {
    const provider = this.getProvider(options.provider);
    if (!provider.streamChat) {
      throw new Error(`Provider ${provider.name} does not support streaming`);
    }
    for await (const chunk of provider.streamChat(messages, options)) {
      yield chunk;
    }
  }

  async listModels(providerType?: ProviderType): Promise<string[]> {
    const provider = this.getProvider(providerType);
    return provider.listModels?.() || [];
  }

  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  hasProvider(type: ProviderType): boolean {
    return this.providers.has(type);
  }
}

export function createDefaultRouter(): LLMRouter {
  return new LLMRouter({
    openrouter: {
      type: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultModel:
        process.env.OPENROUTER_DEFAULT_MODEL || "nvidia/nemotron-3-ultra:free",
    },
    anthropic: {
      type: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultModel:
        process.env.ANTHROPIC_DEFAULT_MODEL || "claude-3-5-sonnet-20241024",
    },
    openai: {
      type: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || "gpt-4o",
    },
    local: {
      type: "local",
      baseURL: process.env.LOCAL_LLM_BASE_URL,
      defaultModel: process.env.LOCAL_DEFAULT_MODEL || "llama3.1:8b",
    },
  });
}

export const defaultRouter = createDefaultRouter();

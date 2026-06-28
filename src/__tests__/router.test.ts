import { describe, it, expect } from "vitest";
import { createDefaultRouter } from "../llm/router";
import { OpenRouterProvider } from "../llm/openrouter";
import { ProviderType } from "../llm/providers";

describe("LLM Router", () => {
  it("should create a default router with openrouter provider", () => {
    const router = createDefaultRouter();
    expect(router.hasProvider("openrouter")).toBe(true);
  });

  it("should return available providers", () => {
    const router = createDefaultRouter();
    const providers = router.getAvailableProviders();
    expect(providers).toContain("openrouter");
  });

  it("should get provider by type", () => {
    const router = createDefaultRouter();
    const provider = router.getProvider("openrouter");
    expect(provider).toBeInstanceOf(OpenRouterProvider);
    expect(provider.name).toBe("openrouter");
  });

  it("should throw for unknown provider", () => {
    const router = createDefaultRouter();
    expect(() => router.getProvider("unknown" as ProviderType)).toThrow("Provider unknown not configured");
  });
});

describe("OpenRouter Provider", () => {
  it("should create provider with default model", () => {
    const provider = new OpenRouterProvider({
      type: "openrouter",
      apiKey: "test-key",
      defaultModel: "test-model",
    });
    expect(provider.name).toBe("openrouter");
  });
});
import {
  LLMProvider,
  LLMMessage,
  LLMOptions,
  LLMResponse,
  ProviderConfig,
} from "./providers";

interface AnthropicContentBlock {
  type: "text" | "tool_use";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

export class AnthropicProvider implements LLMProvider {
  name = "anthropic";
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || "";
    this.baseURL = config.baseURL || "https://api.anthropic.com/v1";
    this.defaultModel = config.defaultModel || "claude-3-5-sonnet-20241022";
  }

  async chat(
    messages: LLMMessage[],
    options: LLMOptions = {},
  ): Promise<LLMResponse> {
    const model = options.model || this.defaultModel;

    const systemMessage = messages.find((m) => m.role === "system");
    const userMessages = messages.filter((m) => m.role !== "system");

    const response = await fetch(`${this.baseURL}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content || [{ type: "text", text: m.content || "" }],
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 4096,
        tools: options.tools?.map((t) => ({
          name: t.function.name,
          description: t.function.description,
          input_schema: t.function.parameters,
        })),
        tool_choice:
          options.toolChoice === "auto"
            ? { type: "auto" }
            : options.toolChoice === "required"
              ? { type: "any" }
              : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as AnthropicResponse;

    const toolCalls = data.content
      .filter((c) => c.type === "tool_use")
      .map((c) => ({
        id: c.id || "",
        type: "function" as const,
        function: {
          name: c.name || "",
          arguments: JSON.stringify(c.input || {}),
        },
      }));

    return {
      content: data.content
        .filter((c) => c.type === "text")
        .map((c) => c.text || "")
        .join(""),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
      model: data.model,
    };
  }

  async listModels(): Promise<string[]> {
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ];
  }
}

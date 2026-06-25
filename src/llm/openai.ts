import {
  LLMProvider,
  LLMMessage,
  LLMOptions,
  LLMResponse,
  ProviderConfig,
} from "./providers";

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

interface OpenAIStreamChoice {
  delta: {
    content?: string;
    tool_calls?: Array<{
      id: string;
      function: { name: string; arguments: string };
    }>;
  };
}

interface OpenAIStreamResponse {
  choices: OpenAIStreamChoice[];
  model: string;
}

interface OpenAIModelList {
  data: Array<{ id: string }>;
}

export class OpenAIProvider implements LLMProvider {
  name = "openai";
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "";
    this.baseURL = config.baseURL || "https://api.openai.com/v1";
    this.defaultModel = config.defaultModel || "gpt-4o";
  }

  async chat(
    messages: LLMMessage[],
    options: LLMOptions = {},
  ): Promise<LLMResponse> {
    const model = options.model || this.defaultModel;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.toolCalls,
          tool_call_id: m.toolCallId,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        tools: options.tools,
        tool_choice: options.toolChoice,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const choice = data.choices[0];

    return {
      content: choice.message.content || "",
      toolCalls: choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        type: "function",
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      model: data.model,
    };
  }

  async *streamChat(
    messages: LLMMessage[],
    options: LLMOptions = {},
  ): AsyncGenerator<LLMResponse, void, unknown> {
    const model = options.model || this.defaultModel;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          tool_calls: m.toolCalls,
          tool_call_id: m.toolCallId,
        })),
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens,
        tools: options.tools,
        tool_choice: options.toolChoice,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;

          try {
            const parsed = JSON.parse(data) as OpenAIStreamResponse;
            const choice = parsed.choices[0];
            if (choice.delta?.content || choice.delta?.tool_calls) {
              yield {
                content: choice.delta.content || "",
                toolCalls: choice.delta.tool_calls?.map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                  },
                })),
                model: parsed.model,
              };
            }
          } catch {}
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseURL}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as OpenAIModelList;
    return data.data?.map((m) => m.id) || [];
  }
}

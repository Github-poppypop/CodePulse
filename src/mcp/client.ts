import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

function getEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

export interface MCPToolArguments {
  [key: string]: unknown;
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();

  async connect(config: MCPServerConfig): Promise<Client> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...getEnv(), ...config.env },
    });

    const client = new Client(
      { name: "codepulse", version: "0.1.0" },
      { capabilities: {} },
    );

    await client.connect(transport);

    this.clients.set(config.name, client);
    this.transports.set(config.name, transport);

    return client;
  }

  async disconnect(name: string): Promise<void> {
    const client = this.clients.get(name);
    const transport = this.transports.get(name);

    if (client) {
      await client.close();
      this.clients.delete(name);
    }
    if (transport) {
      await transport.close();
      this.transports.delete(name);
    }
  }

  getClient(name: string): Client | undefined {
    return this.clients.get(name);
  }

  async listTools(name: string) {
    const client = this.clients.get(name);
    if (!client) throw new Error(`MCP client ${name} not connected`);
    return client.listTools();
  }

  async callTool(name: string, toolName: string, args: MCPToolArguments) {
    const client = this.clients.get(name);
    if (!client) throw new Error(`MCP client ${name} not connected`);
    return client.callTool({ name: toolName, arguments: args });
  }

  async disconnectAll(): Promise<void> {
    for (const name of this.clients.keys()) {
      await this.disconnect(name);
    }
  }
}

export const mcpManager = new MCPClientManager();

// Default MCP server configs matching hermes config
export const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [
  {
    name: "filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/c/projects"],
  },
  {
    name: "github",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || "",
    },
  },
];

export async function initializeMCP(): Promise<MCPClientManager> {
  for (const config of DEFAULT_MCP_SERVERS) {
    try {
      await mcpManager.connect(config);
      console.log(`[MCP] Connected to ${config.name}`);
    } catch (error) {
      console.warn(`[MCP] Failed to connect to ${config.name}:`, error);
    }
  }
  return mcpManager;
}

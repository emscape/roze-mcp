#!/usr/bin/env node

/**
 * Simple MCP Server implementation using JSON-RPC over stdio
 * Since we don't have the official MCP SDK, we'll implement the protocol directly
 */
import * as readline from 'readline';
import { config } from './config';
import {
  readOpenAPI,
  readSchema,
  getApiBaseUrl,
  createOrder,
  createSubscription,
  healthCheck,
  toolDefinitions,
  type SchemaName,
} from './mcp';
import type { ApiTarget } from './config';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Roze MCP Bridge Server
 *
 * Exposes shared tools for VS Code windows to use the same API contract,
 * emulator base URL, and test calls. No secrets are stored or returned.
 */
class RozeMCPServer {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers() {
    this.rl.on('line', async (line) => {
      try {
        const request: JsonRpcRequest = JSON.parse(line);
        const response = await this.handleRequest(request);
        this.sendResponse(response);
      } catch (error) {
        this.log('error', `Failed to parse request: ${error}`);
      }
    });
  }

  private async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      switch (request.method) {
        case 'tools/list':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: Object.entries(toolDefinitions).map(([name, definition]) => ({
                name,
                description: definition.description,
                inputSchema: definition.inputSchema,
              })),
            },
          };

        case 'tools/call':
          const { name, arguments: args } = request.params;
          const result = await this.callTool(name, args);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                },
              ],
            },
          };

        case 'initialize':
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'roze-mcp',
                version: '1.0.0',
              },
            },
          };

        default:
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Method not found: ${request.method}`,
            },
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log('error', `Request failed: ${errorMessage}`);

      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: errorMessage,
        },
      };
    }
  }

  private async callTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'contracts.readOpenAPI':
        return await readOpenAPI();

      case 'contracts.readSchema':
        const schemaName = args?.name as SchemaName;
        if (!schemaName) {
          throw new Error('Schema name is required');
        }
        return await readSchema(schemaName);

      case 'env.getApiBase':
        const target = args?.target as ApiTarget;
        if (!target) {
          throw new Error('Target environment is required');
        }
        return await getApiBaseUrl(target);

      case 'api.orders.create':
        const orderPayload = args?.payload;
        const orderTarget = args?.target as ApiTarget;
        if (!orderPayload || !orderTarget) {
          throw new Error('Payload and target are required');
        }
        return await createOrder(orderPayload, orderTarget);

      case 'api.subscribe.create':
        const subscribePayload = args?.payload;
        const subscribeTarget = args?.target as ApiTarget;
        if (!subscribePayload || !subscribeTarget) {
          throw new Error('Payload and target are required');
        }
        return await createSubscription(subscribePayload, subscribeTarget);

      case 'healthz':
        const healthTarget = args?.target as ApiTarget;
        if (!healthTarget) {
          throw new Error('Target environment is required');
        }
        return await healthCheck(healthTarget);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private sendResponse(response: JsonRpcResponse) {
    console.log(JSON.stringify(response));
  }

  private setupErrorHandling() {
    process.on('SIGINT', () => {
      this.log('info', 'Received SIGINT, shutting down gracefully...');
      this.rl.close();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.log('info', 'Received SIGTERM, shutting down gracefully...');
      this.rl.close();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      this.log('error', `Uncaught exception: ${error.message}`);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      this.log('error', `Unhandled rejection: ${reason}`);
      process.exit(1);
    });
  }

  private log(level: string, message: string) {
    const timestamp = new Date().toISOString();
    const logLevel = config.logLevel;
    
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[logLevel as keyof typeof levels] || 1;
    const messageLevel = levels[level as keyof typeof levels] || 1;
    
    if (messageLevel >= currentLevel) {
      console.error(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
  }

  start() {
    this.log('info', 'MCP server ready');
    // Server is ready to receive JSON-RPC requests via stdin
  }
}

// Start the server
if (require.main === module) {
  const server = new RozeMCPServer();
  server.start();
}

export { RozeMCPServer };

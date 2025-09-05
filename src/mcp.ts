import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { getApiBase, isProxyAllowed, type ApiTarget } from './config';
import { makeRequest, redactPII, type ApiResponse } from './http';

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load and compile schemas
const orderCreateSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/order.create.json'), 'utf8')
);
const subscribeCreateSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/subscribe.create.json'), 'utf8')
);

const validateOrderCreate = ajv.compile(orderCreateSchema);
const validateSubscribeCreate = ajv.compile(subscribeCreateSchema);

// Schema name mapping
const schemaMap = {
  'order.create': orderCreateSchema,
  'subscribe.create': subscribeCreateSchema,
} as const;

export type SchemaName = keyof typeof schemaMap;

/**
 * MCP Tool: Read OpenAPI contract
 */
export async function readOpenAPI(): Promise<string> {
  try {
    const contractPath = path.join(__dirname, '../contracts/openapi.yaml');
    return fs.readFileSync(contractPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read OpenAPI contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * MCP Tool: Read JSON Schema
 */
export async function readSchema(name: SchemaName): Promise<object> {
  const schema = schemaMap[name];
  if (!schema) {
    throw new Error(`Schema '${name}' not found. Available schemas: ${Object.keys(schemaMap).join(', ')}`);
  }
  return schema;
}

/**
 * MCP Tool: Get API base URL for target environment
 */
export async function getApiBaseUrl(target: ApiTarget): Promise<{ base: string; target: string }> {
  return {
    base: getApiBase(target),
    target
  };
}

/**
 * MCP Tool: Create order (dev-only proxy)
 */
export async function createOrder(payload: any, target: ApiTarget): Promise<ApiResponse> {
  // Check if proxy is allowed for this target
  if (!isProxyAllowed(target)) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Proxy disabled in prod; call from app clients with App Check/Auth',
        target,
        proxyMode: 'dev-only'
      },
      error: 'Production proxy calls are disabled for security'
    };
  }

  // Validate payload against schema
  const isValid = validateOrderCreate(payload);
  if (!isValid) {
    const errors = validateOrderCreate.errors?.map(err =>
      `${err.instancePath || 'root'}: ${err.message}`
    ).join('; ') || 'Validation failed';

    console.log('[MCP] Order validation failed:', redactPII({ payload, errors }));

    return {
      status: 400,
      body: { error: 'Validation failed', details: errors },
      ok: false,
      error: `Schema validation failed: ${errors}`,
    };
  }

  // Make API request to dev environment
  const baseUrl = getApiBase(target);
  const url = `${baseUrl}/v1/orders`;

  console.log('[MCP] Creating order via proxy:', redactPII({ target, url: baseUrl }));

  return makeRequest('POST', url, payload);
}

/**
 * MCP Tool: Create subscription (dev-only proxy)
 */
export async function createSubscription(payload: any, target: ApiTarget): Promise<ApiResponse> {
  // Check if proxy is allowed for this target
  if (!isProxyAllowed(target)) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Proxy disabled in prod; call from app clients with App Check/Auth',
        target,
        proxyMode: 'dev-only'
      },
      error: 'Production proxy calls are disabled for security'
    };
  }

  // Validate payload against schema
  const isValid = validateSubscribeCreate(payload);
  if (!isValid) {
    const errors = validateSubscribeCreate.errors?.map(err =>
      `${err.instancePath || 'root'}: ${err.message}`
    ).join('; ') || 'Validation failed';

    console.log('[MCP] Subscription validation failed:', redactPII({ payload, errors }));

    return {
      status: 400,
      body: { error: 'Validation failed', details: errors },
      ok: false,
      error: `Schema validation failed: ${errors}`,
    };
  }

  // Make API request to dev environment
  const baseUrl = getApiBase(target);
  const url = `${baseUrl}/v1/subscribe`;

  console.log('[MCP] Creating subscription via proxy:', redactPII({ target, url: baseUrl }));

  return makeRequest('POST', url, payload);
}

/**
 * MCP Tool: Health check
 */
export async function healthCheck(target: ApiTarget): Promise<{ ok: boolean; status?: number; error?: string; target: string }> {
  const baseUrl = getApiBase(target);
  const url = `${baseUrl}/healthz`;

  console.log(`[MCP] Health check for ${target}:`, baseUrl);

  const response = await makeRequest('GET', url);

  return {
    ok: response.ok,
    status: response.status,
    target,
    ...(response.error && { error: response.error }),
  };
}

/**
 * Tool definitions for MCP server registration
 */
export const toolDefinitions = {
  'contracts_read_openapi': {
    description: 'Read the OpenAPI contract specification',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  'contracts_read_schema': {
    description: 'Read a JSON schema by name',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          enum: ['order.create', 'subscribe.create'],
          description: 'Schema name to retrieve',
        },
      },
      required: ['name'],
    },
  },
  'env_get_api_base': {
    description: 'Get API base URL for target environment',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['dev', 'prod'],
          description: 'Target environment (dev=emulator, prod=production)',
        },
      },
      required: ['target'],
    },
  },
  'api_orders_create': {
    description: 'Create a new order with validation (dev-only proxy)',
    inputSchema: {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          description: 'Order data to create (matches OpenAPI schema)',
        },
        target: {
          type: 'string',
          enum: ['dev', 'prod'],
          description: 'Target environment (prod calls will be blocked)',
        },
      },
      required: ['payload', 'target'],
    },
  },
  'api_subscribe_create': {
    description: 'Create a new subscription with validation (dev-only proxy)',
    inputSchema: {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          description: 'Subscription data to create (matches OpenAPI schema)',
        },
        target: {
          type: 'string',
          enum: ['dev', 'prod'],
          description: 'Target environment (prod calls will be blocked)',
        },
      },
      required: ['payload', 'target'],
    },
  },
  'healthz': {
    description: 'Check API health status for target environment',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['dev', 'prod'],
          description: 'Target environment to check',
        },
      },
      required: ['target'],
    },
  },
} as const;

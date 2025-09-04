import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { getApiBase, type ApiTarget } from './config';
import { makeRequest, type ApiResponse } from './http';

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
 * MCP Tool: Get API base URL
 */
export async function getApiBaseUrl(target: ApiTarget): Promise<{ base: string }> {
  return { base: getApiBase(target) };
}

/**
 * MCP Tool: Create order
 */
export async function createOrder(payload: any, target: ApiTarget): Promise<ApiResponse> {
  // Validate payload against schema
  const isValid = validateOrderCreate(payload);
  if (!isValid) {
    const errors = validateOrderCreate.errors?.map(err => 
      `${err.instancePath || 'root'}: ${err.message}`
    ).join('; ') || 'Validation failed';
    
    return {
      status: 400,
      body: { error: 'Validation failed', details: errors },
      ok: false,
      error: `Schema validation failed: ${errors}`,
    };
  }

  // Make API request
  const baseUrl = getApiBase(target);
  const url = `${baseUrl}/v1/orders`;
  
  return makeRequest('POST', url, payload);
}

/**
 * MCP Tool: Create subscription
 */
export async function createSubscription(payload: any, target: ApiTarget): Promise<ApiResponse> {
  // Validate payload against schema
  const isValid = validateSubscribeCreate(payload);
  if (!isValid) {
    const errors = validateSubscribeCreate.errors?.map(err => 
      `${err.instancePath || 'root'}: ${err.message}`
    ).join('; ') || 'Validation failed';
    
    return {
      status: 400,
      body: { error: 'Validation failed', details: errors },
      ok: false,
      error: `Schema validation failed: ${errors}`,
    };
  }

  // Make API request
  const baseUrl = getApiBase(target);
  const url = `${baseUrl}/v1/subscribe`;
  
  return makeRequest('POST', url, payload);
}

/**
 * MCP Tool: Health check
 */
export async function healthCheck(target: ApiTarget): Promise<{ ok: boolean; status?: number; error?: string }> {
  const baseUrl = getApiBase(target);
  const url = `${baseUrl}/healthz`;
  
  const response = await makeRequest('GET', url);
  
  return {
    ok: response.ok,
    status: response.status,
    ...(response.error && { error: response.error }),
  };
}

/**
 * Tool definitions for MCP server registration
 */
export const toolDefinitions = {
  'contracts.readOpenAPI': {
    description: 'Read the OpenAPI contract specification',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  'contracts.readSchema': {
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
  'env.getApiBase': {
    description: 'Get API base URL for target environment',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['dev', 'prod'],
          description: 'Target environment',
        },
      },
      required: ['target'],
    },
  },
  'api.orders.create': {
    description: 'Create a new order with validation',
    inputSchema: {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          description: 'Order data to create',
        },
        target: {
          type: 'string',
          enum: ['dev', 'prod'],
          description: 'Target environment',
        },
      },
      required: ['payload', 'target'],
    },
  },
  'api.subscribe.create': {
    description: 'Create a new subscription with validation',
    inputSchema: {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          description: 'Subscription data to create',
        },
        target: {
          type: 'string',
          enum: ['dev', 'prod'],
          description: 'Target environment',
        },
      },
      required: ['payload', 'target'],
    },
  },
  'healthz': {
    description: 'Check API health status',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['dev', 'prod'],
          description: 'Target environment',
        },
      },
      required: ['target'],
    },
  },
} as const;

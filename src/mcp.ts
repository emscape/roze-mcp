import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs';
import * as path from 'path';
import { config, type ApiTarget } from './config';
import {
  callHealthz,
  callCreateOrder,
  callCreateSubscription,
  type FirebaseResponse
} from './firebase-client';

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
 * MCP Tool: Get Firebase Function names
 */
export async function getEndpoints(): Promise<{ functions: typeof config.functions }> {
  return { functions: config.functions };
}

/**
 * MCP Tool: Create order
 */
export async function createOrder(payload: any): Promise<FirebaseResponse> {
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

  // Call Firebase Callable Function
  return callCreateOrder(payload);
}

/**
 * MCP Tool: Create subscription
 */
export async function createSubscription(payload: any): Promise<FirebaseResponse> {
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

  // Call Firebase Callable Function
  return callCreateSubscription(payload);
}

/**
 * MCP Tool: Health check
 */
export async function healthCheck(): Promise<{ ok: boolean; status?: number; error?: string }> {
  const response = await callHealthz();

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
  'contracts_readOpenAPI': {
    description: 'Read the OpenAPI contract specification',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  'contracts_readSchema': {
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
  'env_getEndpoints': {
    description: 'Get Firebase Callable Function names',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  'api_orders_create': {
    description: 'Create a new order with validation using Firebase Callable Function (requires authentication)',
    inputSchema: {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          description: 'Order data to create (matches OpenAPI schema)',
        },
      },
      required: ['payload'],
    },
  },
  'api_subscribe_create': {
    description: 'Create a new subscription with validation using Firebase Callable Function (authentication optional)',
    inputSchema: {
      type: 'object',
      properties: {
        payload: {
          type: 'object',
          description: 'Subscription data to create (matches OpenAPI schema)',
        },
      },
      required: ['payload'],
    },
  },
  'healthz': {
    description: 'Check Firebase Callable Functions health status (no authentication required)',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
} as const;

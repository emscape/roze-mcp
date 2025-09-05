import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Parse and validate environment
const env = envSchema.parse(process.env);

// Firebase Callable Functions - secure, authenticated endpoints
const FIREBASE_FUNCTIONS = {
  healthz: 'healthz',
  createOrder: 'createOrder',
  createSubscription: 'createSubscription',
} as const;

export const config = {
  logLevel: env.LOG_LEVEL,
  functions: FIREBASE_FUNCTIONS,
} as const;

export type ApiTarget = 'dev' | 'prod';

// Get Firebase function name
export function getFunctionName(operation: keyof typeof FIREBASE_FUNCTIONS): string {
  return FIREBASE_FUNCTIONS[operation];
}

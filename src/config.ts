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

// Firebase Function URLs - production ready endpoints
const FIREBASE_FUNCTIONS = {
  healthCheck: "https://us-west1-myfriendroze-platform.cloudfunctions.net/healthz",
  createOrder: "https://us-west1-myfriendroze-platform.cloudfunctions.net/createOrder",
  createSubscription: "https://us-west1-myfriendroze-platform.cloudfunctions.net/createSubscription",
} as const;

export const config = {
  logLevel: env.LOG_LEVEL,
  endpoints: FIREBASE_FUNCTIONS,
} as const;

export type ApiTarget = 'dev' | 'prod';

// For now, both dev and prod use the same Firebase Functions
// In the future, you could have separate dev/staging functions
export function getEndpoint(operation: keyof typeof FIREBASE_FUNCTIONS): string {
  return FIREBASE_FUNCTIONS[operation];
}

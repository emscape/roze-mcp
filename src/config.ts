import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  API_BASE_DEV: z.string().url('API_BASE_DEV must be a valid URL'),
  API_BASE_PROD: z.string().url('API_BASE_PROD must be a valid URL'),
  PROXY_MODE: z.enum(['dev-only', 'all']).default('dev-only'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Parse and validate environment
const env = envSchema.parse(process.env);

export const config = {
  apiBaseDev: env.API_BASE_DEV,
  apiBaseProd: env.API_BASE_PROD,
  proxyMode: env.PROXY_MODE,
  logLevel: env.LOG_LEVEL,
} as const;

export type ApiTarget = 'dev' | 'prod';

export function getApiBase(target: ApiTarget): string {
  return target === 'dev' ? config.apiBaseDev : config.apiBaseProd;
}

export function isProxyAllowed(target: ApiTarget): boolean {
  if (config.proxyMode === 'all') return true;
  return target === 'dev'; // dev-only mode
}

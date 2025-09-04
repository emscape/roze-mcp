import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  API_BASE_DEV: z.string().url('API_BASE_DEV must be a valid URL'),
  API_BASE_PROD: z.string().url('API_BASE_PROD must be a valid URL'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Parse and validate environment
const env = envSchema.parse(process.env);

export const config = {
  apiBaseDev: env.API_BASE_DEV,
  apiBaseProd: env.API_BASE_PROD,
  logLevel: env.LOG_LEVEL,
} as const;

export type ApiTarget = 'dev' | 'prod';

export function getApiBase(target: ApiTarget): string {
  return target === 'dev' ? config.apiBaseDev : config.apiBaseProd;
}

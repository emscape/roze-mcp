import axios, { AxiosResponse, AxiosError } from 'axios';

export interface ApiResponse {
  status: number;
  body: any;
  ok: boolean;
  error?: string;
}

export interface ApiError {
  ok: false;
  status: number;
  error: string;
}

/**
 * Make HTTP request with error handling
 * Never exposes secrets in error messages
 */
export async function makeRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any
): Promise<ApiResponse> {
  try {
    const response: AxiosResponse = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'roze-mcp-bridge/1.0.0',
      },
      timeout: 30000, // 30 second timeout
      validateStatus: () => true, // Don't throw on HTTP error status
    });

    return {
      status: response.status,
      body: response.data,
      ok: response.status >= 200 && response.status < 300,
    };
  } catch (error) {
    // Handle network/timeout errors
    if (error instanceof AxiosError) {
      return {
        status: error.response?.status || 0,
        body: null,
        ok: false,
        error: sanitizeError(error.message),
      };
    }

    return {
      status: 0,
      body: null,
      ok: false,
      error: 'Unknown network error',
    };
  }
}

/**
 * Sanitize error messages to prevent secret leakage
 */
function sanitizeError(message: string): string {
  // Remove potential secrets from error messages
  return message
    .replace(/api[_-]?key[s]?[=:]\s*[^\s&]+/gi, 'api_key=***')
    .replace(/token[s]?[=:]\s*[^\s&]+/gi, 'token=***')
    .replace(/secret[s]?[=:]\s*[^\s&]+/gi, 'secret=***')
    .replace(/password[s]?[=:]\s*[^\s&]+/gi, 'password=***');
}

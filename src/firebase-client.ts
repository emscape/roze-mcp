import { 
  healthzCallable, 
  createOrderCallable, 
  createSubscriptionCallable 
} from './firebase';

export interface FirebaseResponse {
  ok: boolean;
  status?: number;
  body?: any;
  error?: string;
}

/**
 * Call Firebase healthz function
 */
export async function callHealthz(): Promise<FirebaseResponse> {
  try {
    const result = await healthzCallable();
    return {
      ok: true,
      status: 200,
      body: result.data,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: error.code === 'unauthenticated' ? 401 : 500,
      error: error.message || 'Firebase function call failed',
      body: { error: error.message },
    };
  }
}

/**
 * Call Firebase createOrder function
 */
export async function callCreateOrder(payload: any): Promise<FirebaseResponse> {
  try {
    const result = await createOrderCallable(payload);
    return {
      ok: true,
      status: 200,
      body: result.data,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: error.code === 'unauthenticated' ? 401 : 
              error.code === 'permission-denied' ? 403 :
              error.code === 'invalid-argument' ? 400 : 500,
      error: error.message || 'Firebase function call failed',
      body: { error: error.message },
    };
  }
}

/**
 * Call Firebase createSubscription function
 */
export async function callCreateSubscription(payload: any): Promise<FirebaseResponse> {
  try {
    const result = await createSubscriptionCallable(payload);
    return {
      ok: true,
      status: 200,
      body: result.data,
    };
  } catch (error: any) {
    return {
      ok: false,
      status: error.code === 'unauthenticated' ? 401 : 
              error.code === 'permission-denied' ? 403 :
              error.code === 'invalid-argument' ? 400 : 500,
      error: error.message || 'Firebase function call failed',
      body: { error: error.message },
    };
  }
}

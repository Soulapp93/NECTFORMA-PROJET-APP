/**
 * Supabase API wrapper with performance monitoring and retry logic
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';

interface MonitoredQueryOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

const DEFAULT_OPTIONS: MonitoredQueryOptions = {
  retries: 3,
  retryDelay: 1000,
  timeout: 30000,
};

/**
 * Execute any async operation with monitoring and retry logic
 */
export async function monitoredOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: MonitoredQueryOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  const { retries, retryDelay, timeout } = { ...DEFAULT_OPTIONS, ...options };
  const startTime = performance.now();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries!; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timeout: ${operationName}`)), timeout);
      });

      // Race between operation and timeout
      const result = await Promise.race([
        operation(),
        timeoutPromise,
      ]);

      const duration = performance.now() - startTime;
      monitoring.trackApiCall(operationName, duration, true, 200);

      return { data: result, error: null };
    } catch (error) {
      lastError = error as Error;
      const duration = performance.now() - startTime;
      
      // Don't retry on certain errors
      const errorMessage = lastError.message || '';
      if (
        errorMessage.includes('JWT') ||
        errorMessage.includes('auth') ||
        errorMessage.includes('permission')
      ) {
        monitoring.trackApiCall(operationName, duration, false, 401);
        return { data: null, error: lastError };
      }

      monitoring.trackApiCall(operationName, duration, false, 500);
      
      if (attempt < retries!) {
        await new Promise(resolve => setTimeout(resolve, retryDelay! * Math.pow(2, attempt)));
        monitoring.captureError(lastError, {
          context: 'monitoredOperation_retry',
          operationName,
          attempt,
        }, 'low');
      } else {
        monitoring.captureError(lastError, {
          context: 'monitoredOperation_failed',
          operationName,
          attempts: retries,
        }, 'medium');
      }
    }
  }

  return { data: null, error: lastError };
}

/**
 * Wrapper for Supabase queries with monitoring
 */
export async function monitoredQuery<T>(
  queryBuilder: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  queryName: string,
  options?: MonitoredQueryOptions
): Promise<{ data: T | null; error: Error | null }> {
  return monitoredOperation(
    async () => {
      const result = await queryBuilder;
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    queryName,
    options
  );
}

/**
 * Helper for RPC calls with monitoring
 */
export async function monitoredRpc<T>(
  rpcCall: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  functionName: string,
  options?: MonitoredQueryOptions
): Promise<{ data: T | null; error: Error | null }> {
  return monitoredQuery(rpcCall, `rpc:${functionName}`, options);
}

// Re-export supabase for convenience
export { supabase };

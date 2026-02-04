/**
 * Performance Optimization Utilities
 * Debouncing, throttling, memoization, and lazy loading helpers
 */

import { useCallback, useRef, useEffect, useState } from 'react';

// ============================================================================
// DEBOUNCE
// ============================================================================

/**
 * Creates a debounced function that delays invoking func until after wait
 * milliseconds have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * React hook for debounced values
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for debounced callback
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

// ============================================================================
// THROTTLE
// ============================================================================

/**
 * Creates a throttled function that only invokes func at most once per
 * every wait milliseconds.
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * React hook for throttled callback
 */
export function useThrottledCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  ) as T;
}

// ============================================================================
// MEMOIZATION
// ============================================================================

/**
 * Simple memoization for expensive computations
 */
export function memoize<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  maxCacheSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func.apply(this, args);
    
    // LRU-style eviction
    if (cache.size >= maxCacheSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    
    cache.set(key, result);
    return result;
  } as T;
}

// ============================================================================
// LAZY LOADING
// ============================================================================

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
}

// ============================================================================
// REQUEST IDLE CALLBACK
// ============================================================================

/**
 * Schedule work during browser idle time
 */
export function scheduleIdleWork(callback: () => void, timeout = 2000): void {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * React hook for idle callbacks
 */
export function useIdleCallback(callback: () => void, deps: React.DependencyList = []): void {
  useEffect(() => {
    let handle: number | ReturnType<typeof setTimeout>;
    
    if ('requestIdleCallback' in window) {
      handle = window.requestIdleCallback(callback);
      return () => window.cancelIdleCallback(handle as number);
    } else {
      handle = setTimeout(callback, 1);
      return () => clearTimeout(handle as ReturnType<typeof setTimeout>);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ============================================================================
// VIRTUAL LIST HELPERS
// ============================================================================

/**
 * Calculate visible items for virtual scrolling
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);
  
  return { start, end };
}

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Preload images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * React hook for progressive image loading
 */
export function useProgressiveImage(lowQualitySrc: string, highQualitySrc: string): string {
  const [src, setSrc] = useState(lowQualitySrc);

  useEffect(() => {
    const img = new Image();
    img.src = highQualitySrc;
    img.onload = () => setSrc(highQualitySrc);
  }, [highQualitySrc]);

  return src;
}

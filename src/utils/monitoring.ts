/**
 * Production Monitoring System
 * Centralized error tracking, performance monitoring, and analytics
 */

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorReport {
  message: string;
  stack?: string;
  context?: string;
  severity: ErrorSeverity;
  timestamp: string;
  url: string;
  userAgent: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private errorQueue: ErrorReport[] = [];
  private metricsQueue: PerformanceMetric[] = [];
  private isProduction = !import.meta.env.DEV;
  private flushInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  private constructor() {
    // Setup global error handlers
    this.setupGlobalHandlers();
    
    // Flush queues periodically (every 30 seconds in production)
    if (this.isProduction) {
      this.flushInterval = setInterval(() => this.flush(), 30000);
    }
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private setupGlobalHandlers() {
    // Capture unhandled errors
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError(error || new Error(String(message)), {
        context: 'window.onerror',
        source,
        lineno,
        colno,
      });
      return false;
    };

    // Capture unhandled promise rejections
    window.onunhandledrejection = (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.captureError(error, {
        context: 'unhandledrejection',
      });
    };

    // Performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              this.trackPerformance('long_task', entry.duration, {
                name: entry.name,
                startTime: entry.startTime,
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch {
        // PerformanceObserver not fully supported
      }
    }
  }

  captureError(
    error: Error,
    metadata?: Record<string, unknown>,
    severity: ErrorSeverity = 'medium'
  ) {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      context: metadata?.context as string,
      severity,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.userId || undefined,
      metadata,
    };

    this.errorQueue.push(report);

    // Log in development
    if (!this.isProduction) {
      console.error('[Monitoring] Error captured:', report);
    }

    // Immediately flush critical errors
    if (severity === 'critical') {
      this.flush();
    }
  }

  trackPerformance(name: string, value: number, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.metricsQueue.push(metric);

    if (!this.isProduction) {
      console.debug('[Monitoring] Performance metric:', metric);
    }
  }

  // Measure component render time
  measureRender(componentName: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      if (duration > 16) { // Longer than 1 frame (60fps)
        this.trackPerformance('slow_render', duration, { componentName });
      }
    };
  }

  // Track page load performance
  trackPageLoad() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const [navigationEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      
      if (navigationEntry) {
        this.trackPerformance('page_load', navigationEntry.loadEventEnd - navigationEntry.startTime);
        this.trackPerformance('dom_interactive', navigationEntry.domInteractive - navigationEntry.startTime);
        this.trackPerformance('first_contentful_paint', navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime);
        this.trackPerformance('time_to_first_byte', navigationEntry.responseStart - navigationEntry.requestStart);
      }
    }
  }

  // Track API call performance
  trackApiCall(endpoint: string, duration: number, success: boolean, statusCode?: number) {
    this.trackPerformance('api_call', duration, {
      endpoint,
      success,
      statusCode,
    });

    // Track slow API calls
    if (duration > 3000) {
      this.captureError(new Error(`Slow API call: ${endpoint} took ${duration}ms`), {
        context: 'slow_api',
        endpoint,
        duration,
      }, 'low');
    }
  }

  private async flush() {
    if (this.errorQueue.length === 0 && this.metricsQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    const metrics = [...this.metricsQueue];
    
    this.errorQueue = [];
    this.metricsQueue = [];

    // In production, you would send these to your monitoring service
    // For now, we'll store critical errors in localStorage for debugging
    if (this.isProduction && errors.length > 0) {
      try {
        const existingErrors = JSON.parse(localStorage.getItem('nf_error_log') || '[]');
        const criticalErrors = errors.filter(e => e.severity === 'critical' || e.severity === 'high');
        const combined = [...existingErrors, ...criticalErrors].slice(-50); // Keep last 50
        localStorage.setItem('nf_error_log', JSON.stringify(combined));
      } catch {
        // localStorage might be full or unavailable
      }
    }

    // Log metrics summary in development
    if (!this.isProduction && metrics.length > 0) {
      console.groupCollapsed('[Monitoring] Performance Summary');
      metrics.forEach(m => console.log(`${m.name}: ${m.value.toFixed(2)}ms`));
      console.groupEnd();
    }
  }

  // Get error log for debugging
  getErrorLog(): ErrorReport[] {
    try {
      return JSON.parse(localStorage.getItem('nf_error_log') || '[]');
    } catch {
      return [];
    }
  }

  clearErrorLog() {
    localStorage.removeItem('nf_error_log');
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Convenience functions
export const captureError = monitoring.captureError.bind(monitoring);
export const trackPerformance = monitoring.trackPerformance.bind(monitoring);
export const measureRender = monitoring.measureRender.bind(monitoring);
export const trackApiCall = monitoring.trackApiCall.bind(monitoring);

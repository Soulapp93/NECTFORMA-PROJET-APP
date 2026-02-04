/**
 * React hook for component-level performance monitoring
 */

import React, { useEffect, useRef } from 'react';
import { monitoring } from '@/utils/monitoring';

interface PerformanceMonitorOptions {
  componentName: string;
  trackRenders?: boolean;
  warnThreshold?: number; // ms
}

/**
 * Hook to monitor component performance
 * Tracks render times and warns about slow renders
 */
export function usePerformanceMonitor(options: PerformanceMonitorOptions) {
  const { componentName, trackRenders = true, warnThreshold = 16 } = options;
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    if (!trackRenders) return;

    const renderTime = performance.now() - lastRenderTime.current;
    renderCount.current += 1;

    if (renderTime > warnThreshold) {
      monitoring.trackPerformance('slow_component_render', renderTime, {
        componentName,
        renderCount: renderCount.current,
      });
    }

    lastRenderTime.current = performance.now();
  });

  // Track mount/unmount
  useEffect(() => {
    const mountTime = performance.now();
    
    monitoring.trackPerformance('component_mount', 0, {
      componentName,
    });

    return () => {
      const lifetime = performance.now() - mountTime;
      monitoring.trackPerformance('component_unmount', lifetime, {
        componentName,
        totalRenders: renderCount.current,
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * HOC for performance monitoring
 */
export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  const MonitoredComponent: React.FC<P> = (props) => {
    usePerformanceMonitor({ componentName });
    return React.createElement(WrappedComponent, props);
  };
  MonitoredComponent.displayName = `WithPerformanceMonitor(${componentName})`;
  return MonitoredComponent;
}

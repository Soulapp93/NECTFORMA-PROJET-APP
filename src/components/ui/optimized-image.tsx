/**
 * Performance-optimized image component with lazy loading
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  containerClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  placeholderSrc,
  className,
  containerClassName,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div 
      ref={imgRef} 
      className={cn(
        'relative overflow-hidden bg-muted',
        containerClassName
      )}
    >
      {/* Placeholder / Loading state */}
      {(!isLoaded || !isInView) && !hasError && (
        <div 
          className={cn(
            'absolute inset-0 animate-pulse bg-muted',
            className
          )}
          style={placeholderSrc ? { backgroundImage: `url(${placeholderSrc})`, backgroundSize: 'cover' } : undefined}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className={cn('absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground', className)}>
          <span className="text-sm">Image non disponible</span>
        </div>
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}

export default OptimizedImage;

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

export const GoogleAnalytics = ({ measurementId }: GoogleAnalyticsProps) => {
  const location = useLocation();

  useEffect(() => {
    // Don't load in development
    if (import.meta.env.DEV) return;
    if (!measurementId) return;

    // Load gtag script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      page_path: location.pathname,
    });

    return () => {
      document.head.removeChild(script);
    };
  }, [measurementId]);

  // Track page views on route change
  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    
    window.gtag('config', measurementId, {
      page_path: location.pathname,
    });
  }, [location, measurementId]);

  return null;
};

// Analytics event tracking utilities
export const trackEvent = (
  eventName: string,
  parameters?: Record<string, string | number | boolean>
) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, parameters);
};

export const trackBlogView = (postSlug: string, postTitle: string) => {
  trackEvent('blog_view', {
    post_slug: postSlug,
    post_title: postTitle,
    content_type: 'blog_post'
  });
};

export const trackBlogEngagement = (
  postSlug: string, 
  action: 'scroll_50' | 'scroll_100' | 'share' | 'time_30s' | 'time_60s'
) => {
  trackEvent('blog_engagement', {
    post_slug: postSlug,
    engagement_type: action
  });
};

export const trackNewsletterSignup = (source: string) => {
  trackEvent('newsletter_signup', {
    source
  });
};

export const trackCTAClick = (ctaName: string, location: string) => {
  trackEvent('cta_click', {
    cta_name: ctaName,
    location
  });
};

export default GoogleAnalytics;

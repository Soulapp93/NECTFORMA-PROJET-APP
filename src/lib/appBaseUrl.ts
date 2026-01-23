/**
 * Base URL used in emails (activation/reset).
 *
 * Now using the custom domain nectforma.com which is configured
 * as a custom domain in Lovable and serves the application.
 */
export const APP_PUBLISHED_URL = "https://nectforma.com";

export function getAppBaseUrl(): string {
  const origin = window.location.origin;

  // If we are on local dev or Lovable preview, use current origin for testing.
  if (
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin.includes("-preview--")
  ) {
    return origin;
  }

  // For production and published environments, use the custom domain.
  return APP_PUBLISHED_URL;
}

/**
 * Sparka SSO - Cross-subdomain authentication with Sparka (chat.masonjames.com)
 *
 * Validates Sparka session cookies and enables SSO across *.masonjames.com subdomains.
 */

import logger from "./logger";

const log = logger.getSubLogger({ prefix: ["sparka-sso"] });

const SPARKA_VALIDATE_URL =
  process.env.SPARKA_VALIDATE_URL || "https://chat.masonjames.com/api/auth/validate";
const SPARKA_LOGIN_URL = process.env.SPARKA_LOGIN_URL || "https://chat.masonjames.com/login";

export interface SparkaUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface SparkaEntitlement {
  entitled: boolean;
  tier: string | null;
  source: string | null;
  reason: string | null;
}

export interface SparkaCredits {
  totalCredits: number;
  availableCredits: number;
  reservedCredits: number;
}

export interface SparkaValidateResponse {
  authenticated: boolean;
  reason?: string;
  user?: SparkaUser;
  entitlement?: SparkaEntitlement;
  credits?: SparkaCredits;
}

/**
 * Validate a Sparka session by forwarding cookies to the validate endpoint.
 */
export async function validateSparkaSession({
  cookieHeader,
  origin,
}: {
  cookieHeader: string;
  origin?: string;
}): Promise<SparkaValidateResponse> {
  try {
    const response = await fetch(SPARKA_VALIDATE_URL, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        Origin: origin || "https://cal.masonjames.com",
        Accept: "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      log.debug("Sparka validation failed", { status: response.status });
      return {
        authenticated: false,
        reason: `http_${response.status}`,
      };
    }

    const data = (await response.json()) as SparkaValidateResponse;
    log.debug("Sparka validation response", { authenticated: data.authenticated });
    return data;
  } catch (error) {
    log.error("Sparka validation error", { error });
    return {
      authenticated: false,
      reason: "network_error",
    };
  }
}

/**
 * Get the Sparka login URL with return redirect.
 */
export function getSparkaLoginUrl({ returnTo }: { returnTo?: string } = {}): string {
  const redirectUrl = returnTo || process.env.NEXT_PUBLIC_WEBAPP_URL || "https://cal.masonjames.com";
  return `${SPARKA_LOGIN_URL}?returnTo=${encodeURIComponent(redirectUrl)}`;
}

/**
 * Check if Sparka SSO is enabled.
 */
export function isSparkaEnabled(): boolean {
  return process.env.SPARKA_SSO_ENABLED === "true";
}

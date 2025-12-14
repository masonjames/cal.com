import type { NextApiRequest, NextApiResponse } from "next";
import { signIn } from "next-auth/react";

import { getSparkaLoginUrl, isSparkaEnabled, validateSparkaSession } from "@calcom/lib/sparka-sso";

/**
 * Sparka SSO Callback
 *
 * This endpoint is called when a user returns from Sparka login.
 * It validates the Sparka session cookie and initiates NextAuth sign-in.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isSparkaEnabled()) {
    return res.status(404).json({ error: "Sparka SSO is not enabled" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    // No cookie, redirect to Sparka login
    const returnTo = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/api/auth/sparka/callback`;
    return res.redirect(getSparkaLoginUrl({ returnTo }));
  }

  // Validate the Sparka session
  const sparkaSession = await validateSparkaSession({
    cookieHeader,
    origin: req.headers.origin,
  });

  if (!sparkaSession.authenticated || !sparkaSession.user) {
    // Not authenticated, redirect to Sparka login
    const returnTo = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/api/auth/sparka/callback`;
    return res.redirect(getSparkaLoginUrl({ returnTo }));
  }

  // Redirect to client-side sign-in flow
  // The client will call signIn('sparka-sso') which validates the cookie server-side
  const callbackUrl = (req.query.callbackUrl as string) || "/";
  return res.redirect(`/auth/sso/sparka?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}

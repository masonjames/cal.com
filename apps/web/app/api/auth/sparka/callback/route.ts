import { NextRequest, NextResponse } from "next/server";

import { getSparkaLoginUrl, isSparkaEnabled, validateSparkaSession } from "@calcom/lib/sparka-sso";

/**
 * Sparka SSO Callback (App Router)
 *
 * This endpoint is called when a user clicks "Sign in with Sparka".
 * It validates the Sparka session cookie and redirects appropriately.
 */
export async function GET(request: NextRequest) {
  if (!isSparkaEnabled()) {
    return NextResponse.json({ error: "Sparka SSO is not enabled" }, { status: 404 });
  }

  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    // No cookie, redirect to Sparka login
    const returnTo = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/api/auth/sparka/callback`;
    return NextResponse.redirect(getSparkaLoginUrl({ returnTo }));
  }

  // Validate the Sparka session
  const sparkaSession = await validateSparkaSession({
    cookieHeader,
    origin: request.headers.get("origin") || undefined,
  });

  if (!sparkaSession.authenticated || !sparkaSession.user) {
    // Not authenticated, redirect to Sparka login
    const returnTo = `${process.env.NEXT_PUBLIC_WEBAPP_URL}/api/auth/sparka/callback`;
    return NextResponse.redirect(getSparkaLoginUrl({ returnTo }));
  }

  // Redirect to client-side sign-in flow
  // The client will call signIn('sparka-sso') which validates the cookie server-side
  const searchParams = request.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const ssoPageUrl = new URL("/auth/sso/sparka", process.env.NEXT_PUBLIC_WEBAPP_URL);
  ssoPageUrl.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(ssoPageUrl.toString());
}

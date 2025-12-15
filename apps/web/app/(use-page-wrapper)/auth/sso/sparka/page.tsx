"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Sparka SSO Page
 *
 * This page handles Sparka SSO authentication:
 * 1. Attempts to sign in using the sparka-sso NextAuth provider
 * 2. If successful, redirects to the callback URL
 * 3. If no valid Sparka session exists, redirects to Sparka login
 */
export default function SparkaSSOPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";
  const [status, setStatus] = useState<"loading" | "error" | "redirecting">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSignIn = async () => {
      try {
        const result = await signIn("sparka-sso", {
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          // Check if the error indicates no Sparka session
          if (result.error === "CredentialsSignin" || result.error.includes("not authenticated")) {
            // No valid Sparka session, redirect to Sparka login
            setStatus("redirecting");
            const returnTo = `${window.location.origin}/auth/sso/sparka?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            const sparkaLoginUrl = process.env.NEXT_PUBLIC_SPARKA_LOGIN_URL || "https://chat.masonjames.com/login";
            window.location.href = `${sparkaLoginUrl}?returnTo=${encodeURIComponent(returnTo)}`;
          } else {
            setStatus("error");
            setError(result.error);
          }
        } else if (result?.url) {
          // Successful sign-in, redirect to the callback URL
          window.location.href = result.url;
        }
      } catch (err) {
        setStatus("error");
        setError("An unexpected error occurred");
      }
    };

    performSignIn();
  }, [callbackUrl]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Sign-in Failed</h1>
          <p className="mt-2 text-gray-600">{error || "Unable to complete sign-in"}</p>
          <a
            href="/auth/login"
            className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
          >
            Return to Login
          </a>
        </div>
      </div>
    );
  }

  if (status === "redirecting") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          <p className="mt-4 text-gray-600">Redirecting to Sparka login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        <p className="mt-4 text-gray-600">Signing you in via Sparka...</p>
      </div>
    </div>
  );
}

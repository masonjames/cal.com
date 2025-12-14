"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Sparka SSO Page
 *
 * This page is reached after the user returns from Sparka login.
 * It automatically triggers the NextAuth sign-in with the sparka-sso provider,
 * which validates the cross-subdomain cookie and creates/links the user.
 */
export default function SparkaSSOPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSignIn = async () => {
      try {
        const result = await signIn("sparka-sso", {
          redirect: false,
          callbackUrl,
        });

        if (result?.error) {
          setStatus("error");
          setError(result.error);
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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
        <p className="mt-4 text-gray-600">Signing you in via Sparka...</p>
      </div>
    </div>
  );
}

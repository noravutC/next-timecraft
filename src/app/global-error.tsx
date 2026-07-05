"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex h-screen flex-col items-center justify-center gap-4">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <button
          onClick={reset}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}

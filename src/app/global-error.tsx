"use client";

import "./globals.css";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "./_components/status-screen";

// Replaces the root layout when it crashes, so it brings its own html/body
// and stylesheet.
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
    <html lang="en">
      <body className="font-sans">
        <StatusScreen
          tone="danger"
          icon={<AlertTriangle />}
          title="Something went wrong"
          description="The page hit an error. Your saved work is safe."
          action={
            <Button size="sm" onClick={reset}>
              Try again
            </Button>
          }
        />
      </body>
    </html>
  );
}

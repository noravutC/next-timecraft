"use client";

import Link from "next/link";
import { getSession, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthHeader } from "@/components/auth/auth-header";
import { LoaderScreen } from "@/components/ui/loader";
import {
  closesAfterSignIn,
  signInDestination,
} from "@/helper/utils/sign-in-destination";
import { SignInOptions } from "./_components/sign-in-options";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);
  const organizationId = session?.user?.organizationId?.trim() ?? "";
  const canCreateOrg = session?.user?.canCreateOrg ?? false;
  const hasBoards = session?.user?.hasBoards ?? false;

  useEffect(() => {
    if (status !== "authenticated" || !session) return;
    const destination = signInDestination({
      organizationId,
      canCreateOrg,
      hasBoards,
    });
    // opened by "Sign in again": tell the tab that asked, then go away
    if (closesAfterSignIn(window.location.search)) {
      void getSession().then(() => {
        window.close();
        // a browser that keeps the window open gets a normal sign-in
        setTimeout(() => router.replace(destination), 300);
      });
      return;
    }
    router.replace(destination);
  }, [status, session, organizationId, canCreateOrg, hasBoards, router]);

  const handleGuestLogin = async () => {
    if (guestLoading) return;
    setGuestLoading(true);
    await signIn("guest", { redirect: false });
  };

  if (status !== "unauthenticated") {
    return (
      <LoaderScreen
        title="Setting up your workspace"
        label="Loading your boards…"
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <AuthHeader logoHref="/timecraft">
        <Link
          href="/timecraft"
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          What is TimeCraft?
        </Link>
      </AuthHeader>

      <main className="grid flex-1 place-items-center px-4 pt-6 pb-16">
        <div className="flex w-full max-w-90 flex-col gap-7">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-title font-semibold tracking-tight">
              Sign in to TimeCraft
            </h1>
            <p className="text-md text-ink-muted">
              Boards, tasks and teammates in one place.
            </p>
          </div>

          <SignInOptions
            onGoogle={() => void signIn("google")}
            onGuest={() => void handleGuestLogin()}
            guestLoading={guestLoading}
          />
        </div>
      </main>

      <footer className="flex h-14 shrink-0 items-center justify-center text-xs text-ink-subtle">
        © 2026 TimeCraft
      </footer>
    </div>
  );
}

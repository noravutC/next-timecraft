"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, User } from "lucide-react";
import { toast } from "sonner";
// components
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader, LoaderScreen } from "@/components/ui/loader";

const BRAND = "TimeCraft";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [guestLoading, setGuestLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const organizationId = session?.user?.organizationId?.trim() ?? "";
  const canCreateOrg = session?.user?.canCreateOrg ?? false;

  useEffect(() => {
    if (status !== "authenticated" || !session) {
      return;
    }

    if (organizationId) {
      router.replace("/project");
      return;
    }

    if (canCreateOrg) {
      router.replace("/organization/create");
    } else {
      router.replace("/project");
    }
  }, [status, session, organizationId, canCreateOrg, router]);

  const handleGuestLogin = async () => {
    if (guestLoading) return;
    setGuestLoading(true);
    await signIn("guest", { redirect: false });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.info("Email sign-in is coming soon — please continue with Google.");
  };

  if (status !== "unauthenticated") {
    return (
      <LoaderScreen
        title="Setting up your workspace"
        label="Loading your boards and timelines…"
      />
    );
  }

  return (
    <div className="flex min-h-screen w-full text-gray-900 antialiased">
      {/* LEFT · FORM PANEL */}
      <section className="flex w-full flex-col overflow-auto bg-white px-6 py-10 sm:px-12 lg:max-w-[640px] lg:flex-[0_0_46%] lg:px-18 lg:py-11">
        {/* brand */}
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-brand shadow-lg shadow-brand/30">
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M6 14v4" />
              <path d="M12 7v11" />
              <path d="M18 11v7" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight">{BRAND}</span>
        </div>

        {/* form block */}
        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="mb-2 text-2xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="mb-6 text-sm leading-relaxed text-gray-500">
              Sign in to manage your team&apos;s boards, tasks, and timelines.
            </p>

            {/* Google */}
            <button
              type="button"
              onClick={() => signIn("google")}
              className="flex h-10 w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-900 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1a6.6 6.6 0 0 1 0-4.22V7.04H2.18a11 11 0 0 0 0 9.92l3.66-2.86Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.04l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3.5">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-400">
                or continue with email
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Label
                  htmlFor="tc-email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email
                </Label>
                <Input
                  id="tc-email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="h-10 rounded-xl border-gray-200 px-3.5 text-sm focus-visible:border-brand focus-visible:ring-brand/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label
                    htmlFor="tc-pass"
                    className="text-sm font-semibold text-gray-700"
                  >
                    Password
                  </Label>
                  <a
                    href="#"
                    className="text-sm font-semibold text-brand no-underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="tc-pass"
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-10 rounded-xl border-gray-200 pr-12 pl-3.5 text-sm focus-visible:border-brand focus-visible:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    {showPw ? (
                      <EyeOff className="size-[18px]" />
                    ) : (
                      <Eye className="size-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              <Label className="flex cursor-pointer items-center gap-2.5 text-sm font-normal text-gray-600">
                <Checkbox
                  name="remember"
                  className="data-[state=checked]:border-brand data-[state=checked]:bg-brand"
                />
                Keep me signed in for 30 days
              </Label>

              <button
                type="submit"
                className="mt-1 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-colors hover:bg-brand-dark active:translate-y-px"
              >
                Sign in
              </button>
            </form>

            {/* Guest */}
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-100 disabled:opacity-70"
            >
              {guestLoading ? (
                <Loader size="xs" />
              ) : (
                <User className="size-[17px]" />
              )}
              {guestLoading ? "Signing in as guest…" : "Continue as guest"}
            </button>

            <p className="mt-6 text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <a href="#" className="font-semibold text-brand no-underline">
                Sign up free
              </a>
            </p>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>© 2026 {BRAND}</span>
          <div className="flex gap-4">
            <a href="#" className="text-gray-400 no-underline">
              Privacy
            </a>
            <a href="#" className="text-gray-400 no-underline">
              Terms
            </a>
          </div>
        </div>
      </section>

      {/* RIGHT · PRODUCT PANEL */}
      <section
        className="relative hidden min-w-0 flex-1 flex-col justify-between overflow-hidden px-14 pt-14 pb-13 text-white lg:flex"
        style={{
          background:
            "radial-gradient(120% 90% at 12% 8%, color-mix(in oklab, var(--brand), white 14%), transparent 56%), linear-gradient(158deg, var(--brand), color-mix(in oklab, var(--brand), black 56%))",
        }}
      >
        {/* soft glow */}
        <div
          className="pointer-events-none absolute -right-30 -bottom-35 size-[420px] rounded-full opacity-35"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--brand), white 26%), transparent 70%)",
          }}
        />

        {/* headline */}
        <div className="relative max-w-[480px]">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-xs font-semibold">
            <span className="size-2 rounded-full bg-emerald-300" />
            Run your whole team in one place
          </div>
          <h2 className="mb-3.5 text-4xl font-bold leading-tight tracking-tight">
            Turn plans into
            <br />
            progress you can
            <br />
            actually see
          </h2>
          <p className="max-w-[430px] text-base leading-relaxed text-white/80">
            Plan with Kanban, track on the Timeline, and keep your whole team
            aligned in real time.
          </p>
        </div>

        {/* floating product preview */}
        <div className="relative my-8 flex justify-center">
          <div className="animate-tc-float w-[min(560px,100%)] rounded-2xl bg-white p-4.5 text-gray-900 shadow-2xl shadow-indigo-950/40">
            {/* window bar */}
            <div className="flex items-center gap-2.5 px-1 pt-0.5 pb-3.5">
              <span className="size-2.5 rounded-full bg-red-400" />
              <span className="size-2.5 rounded-full bg-amber-400" />
              <span className="size-2.5 rounded-full bg-green-500" />
              <span className="ml-2 text-xs font-semibold text-gray-500">
                Sprint 24 · Product team board
              </span>
            </div>

            {/* columns */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* To do */}
              <div className="rounded-xl bg-gray-50 p-2.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide text-gray-500">
                    To do
                  </span>
                  <span className="rounded-md bg-white px-1.5 py-px text-xs font-bold text-gray-400">
                    3
                  </span>
                </div>
                <div className="mb-2 rounded-lg border border-gray-100 bg-white p-2.5">
                  <span className="mb-2 inline-block h-1.5 w-5.5 rounded-sm bg-brand" />
                  <div className="text-xs font-semibold leading-snug">
                    Redesign the login page
                  </div>
                  <div className="mt-2 flex">
                    <span className="size-4.5 rounded-full border-2 border-white bg-amber-300" />
                    <span className="-ml-1.5 size-4.5 rounded-full border-2 border-white bg-blue-300" />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-2.5">
                  <span className="mb-2 inline-block h-1.5 w-5.5 rounded-sm bg-amber-500" />
                  <div className="text-xs font-semibold leading-snug">
                    Review new-user flow
                  </div>
                </div>
              </div>

              {/* In progress */}
              <div className="rounded-xl bg-gray-50 p-2.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide text-gray-500">
                    In progress
                  </span>
                  <span className="rounded-md bg-white px-1.5 py-px text-xs font-bold text-gray-400">
                    2
                  </span>
                </div>
                <div className="mb-2 rounded-lg border border-gray-100 bg-white p-2.5">
                  <span className="mb-2 inline-block h-1.5 w-5.5 rounded-sm bg-violet-500" />
                  <div className="text-xs font-semibold leading-snug">
                    Wire up calendar API
                  </div>
                  <div className="mt-2 h-1.5 rounded-sm bg-gray-100">
                    <div className="h-full w-[62%] rounded-sm bg-brand" />
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-2.5">
                  <span className="mb-2 inline-block h-1.5 w-5.5 rounded-sm bg-brand" />
                  <div className="text-xs font-semibold leading-snug">
                    Polish Timeline view
                  </div>
                </div>
              </div>

              {/* Done */}
              <div className="rounded-xl bg-gray-50 p-2.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide text-gray-500">
                    Done
                  </span>
                  <span className="rounded-md bg-white px-1.5 py-px text-xs font-bold text-gray-400">
                    5
                  </span>
                </div>
                <div className="mb-2 rounded-lg border border-gray-100 bg-white p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="grid size-4 place-items-center rounded-full bg-green-600">
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12l5 5L20 6" />
                      </svg>
                    </span>
                    <div className="text-xs font-semibold text-gray-400 line-through">
                      Set up workspace
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="grid size-4 place-items-center rounded-full bg-green-600">
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12l5 5L20 6" />
                      </svg>
                    </span>
                    <div className="text-xs font-semibold text-gray-400 line-through">
                      Invite team members
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* timeline strip */}
            <div className="mt-3 rounded-xl bg-gray-50 p-3">
              <div className="mb-2.5 text-xs font-bold tracking-wide text-gray-500">
                TIMELINE · JUN
              </div>
              <div className="flex flex-col gap-2">
                <div className="relative h-2 rounded-sm bg-white">
                  <div className="absolute inset-y-0 left-[4%] w-[38%] rounded-sm bg-brand" />
                </div>
                <div className="relative h-2 rounded-sm bg-white">
                  <div className="absolute inset-y-0 left-[26%] w-[44%] rounded-sm bg-violet-500" />
                </div>
                <div className="relative h-2 rounded-sm bg-white">
                  <div className="absolute inset-y-0 left-[56%] w-[32%] rounded-sm bg-amber-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* bottom trust row */}
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2.5">
            {["Kanban", "Timeline", "Automation"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/15 bg-white/15 px-3.5 py-1.5 text-xs font-semibold"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="text-right text-xs whitespace-nowrap text-white/80">
            Trusted by <strong className="text-white">12,000+</strong> teams
          </div>
        </div>
      </section>
    </div>
  );
}

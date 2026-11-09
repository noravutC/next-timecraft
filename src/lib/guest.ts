import type { Session } from 'next-auth';

// Every "Continue as guest" visitor shares one account, so guests must not
// own anything private (API keys) or reach outside the demo (invite emails).
export const isGuestSession = (session: Session | null | undefined) =>
  session?.user?.provider === 'guest';

/** The one account every "Continue as guest" visitor signs in as. */
export const GUEST_EMAIL = 'guest@timecraft.demo';

export const isGuestEmail = (email: string | null | undefined) =>
  email?.trim().toLowerCase() === GUEST_EMAIL;

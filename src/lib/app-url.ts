/** Where the app is served, for links in emails, metadata and feeds. */
export const appUrl = () =>
  process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

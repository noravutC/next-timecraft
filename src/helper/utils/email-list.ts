/**
 * Adds a typed email to a list: trimmed, lower-cased, no duplicates.
 * Returns null when the input isn't an email or is already listed.
 */
export const appendEmail = (emails: string[], raw: string): string[] | null => {
  const email = raw.trim().toLowerCase();
  if (!email || !email.includes('@') || emails.includes(email)) return null;
  return [...emails, email];
};

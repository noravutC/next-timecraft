/**
 * Adds a typed email to a list: trimmed, lower-cased, no duplicates.
 * Returns null when the input isn't an email or is already listed.
 */
export const appendEmail = (emails: string[], raw: string): string[] | null => {
  const email = raw.trim().toLowerCase();
  if (!email || !email.includes('@') || emails.includes(email)) return null;
  return [...emails, email];
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Addresses typed into one box, separated by commas, spaces or semicolons:
 * the valid ones (lower-cased, once each) and what didn't look like one.
 */
export const parseEmailList = (
  raw: string,
): { emails: string[]; invalid: string[] } => {
  const parts = raw
    .split(/[\s,;]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  return {
    emails: [...new Set(parts.filter((p) => EMAIL_PATTERN.test(p)))],
    invalid: parts.filter((p) => !EMAIL_PATTERN.test(p)),
  };
};

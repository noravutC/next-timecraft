// Supabase is reached over the internet, so every connection must be
// encrypted (postgres.js and drizzle-kit default to plaintext). Local
// Postgres (docker compose `db`, localhost) has no TLS and is exempt.
// `require` = encrypt without CA pinning; Supabase's cert isn't in Node's
// default CA store.
const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'db']);

export const isLocalDatabase = (connectionString: string) => {
  try {
    return LOCAL_DB_HOSTS.has(new URL(connectionString).hostname);
  } catch {
    return false; // unparsable URL: treat as remote, stay on the safe side
  }
};

/** postgres.js `ssl` option for this database. */
export const sslFor = (connectionString: string) =>
  isLocalDatabase(connectionString) ? false : ('require' as const);

/** Same rule for tools that only take a URL (drizzle-kit): add sslmode. */
export const withSslMode = (connectionString: string) => {
  if (isLocalDatabase(connectionString)) return connectionString;
  if (/[?&]sslmode=/.test(connectionString)) return connectionString;
  return `${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=require`;
};

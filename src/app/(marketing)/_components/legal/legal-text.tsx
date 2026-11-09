import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CONTACT_EMAIL } from './legal-facts';

// The few text shapes the legal pages are made of.

export const LegalText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-ink-muted">{children}</p>
);

export const LegalList = ({ children }: { children: React.ReactNode }) => (
  <ul className="flex list-disc flex-col gap-2.5 pl-5 text-ink-muted">
    {children}
  </ul>
);

/** A list item that starts with a bold lead: "From Google sign-in: …" */
export const LegalPoint = ({
  lead,
  children,
}: {
  lead?: string;
  children: React.ReactNode;
}) => (
  <li>
    {lead && <strong className="font-semibold text-ink">{lead}</strong>}{' '}
    {children}
  </li>
);

export const LegalLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="font-medium text-ink underline underline-offset-3"
  >
    {children}
  </Link>
);

export const ContactEmail = () => (
  <a
    href={`mailto:${CONTACT_EMAIL}`}
    className="font-medium text-ink underline underline-offset-3"
  >
    {CONTACT_EMAIL}
  </a>
);

/** Name on the left, what it does on the right; stacks when narrow. */
export const ProviderTable = ({
  rows,
}: {
  rows: { name: string; role: string }[];
}) => (
  <div className="flex flex-col overflow-hidden rounded-popover border border-line">
    {rows.map((row, index) => (
      <div
        key={row.name}
        className={cn(
          'flex flex-wrap gap-x-4 gap-y-1 px-4 py-3',
          index > 0 && 'border-t border-line-soft',
        )}
      >
        <span className="grow basis-40 text-base font-medium">{row.name}</span>
        <span className="grow-999 basis-75 text-base leading-5.25 text-ink-muted">
          {row.role}
        </span>
      </div>
    ))}
  </div>
);

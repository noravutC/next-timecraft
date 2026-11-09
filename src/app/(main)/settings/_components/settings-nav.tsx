'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: 'Account',
    links: [{ href: '/settings/profile', label: 'Profile' }],
  },
];

/** Settings sections, grouped by account and workspace. */
export const SettingsNav = () => {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings"
      className="flex shrink-0 flex-col gap-0.5 md:w-55"
    >
      <Link
        href="/project"
        className="mb-3 flex h-8 items-center gap-2 rounded-md px-2 text-sm text-ink-muted hover:bg-surface-hover hover:text-ink"
      >
        <ArrowLeft className="size-3.75" />
        Back to boards
      </Link>
      {GROUPS.map((group, index) => (
        <div key={group.label} className="flex flex-col gap-0.5">
          <span
            className={cn(
              'px-2 pb-1 text-xs font-medium text-ink-subtle',
              index > 0 && 'pt-4',
            )}
          >
            {group.label}
          </span>
          {group.links.map((link) => {
            const current = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'flex h-8 items-center rounded-md px-2 text-sm',
                  current
                    ? 'bg-surface-hover font-medium text-ink'
                    : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

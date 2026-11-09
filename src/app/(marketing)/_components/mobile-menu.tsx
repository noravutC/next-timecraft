'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MOBILE_MENU } from './landing-content';

/** Below md: the header's menu button and the panel it opens. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          '-mr-4 size-11 rounded-lg p-0',
          open && 'bg-surface-hover',
        )}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>
      {open && (
        <>
          {/* the header contains these (sticky + blur), so they're absolute */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-x-0 top-full h-screen cursor-default bg-black/28"
          />
          <nav
            id="mobile-menu"
            aria-label="Site"
            className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-line bg-background px-3 pt-2 pb-5 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.24)]"
          >
            {MOBILE_MENU.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={close}
                className="flex h-12 items-center gap-2.5 rounded-lg px-2 text-lg font-medium text-ink hover:bg-surface-hover"
              >
                {link.label}
                {link.badge && (
                  <span className="h-5.5 rounded-full border border-line px-2 text-2xs leading-5 font-normal text-ink-muted">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
            <div className="mx-2 my-2 h-px bg-line-soft" />
            <div className="flex flex-col gap-2.5 px-2 pt-1">
              <Button asChild className="h-12 rounded-lg text-md">
                <Link href="/login" onClick={close}>
                  Start free
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-lg border-input text-md"
              >
                <Link href="/login" onClick={close}>
                  Sign in
                </Link>
              </Button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

import { Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMAIL, GITHUB_URL, LINKEDIN_URL } from './case-study-content';

const PROFILE_LINKS = [
  { label: 'GitHub', href: GITHUB_URL, Icon: Github },
  { label: 'LinkedIn', href: LINKEDIN_URL, Icon: Linkedin },
];

export function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-16 border-t border-line bg-surface"
    >
      <div className="mx-auto flex max-w-292 flex-col items-center gap-4.5 px-6 py-24 text-center">
        <h2 className="text-cta-sm font-semibold tracking-tighter">
          Let&rsquo;s talk.
        </h2>
        <p className="max-w-120 text-copy text-ink-muted">
          Open to full-stack roles and interesting projects. The fastest way to
          reach me is email.
        </p>
        <a
          href={`mailto:${EMAIL}`}
          className="font-mono text-md leading-6 break-all text-ink underline-offset-3 hover:underline"
        >
          {EMAIL}
        </a>
        <div className="flex flex-wrap justify-center gap-2.5">
          {PROFILE_LINKS.map(({ label, href, Icon }) => (
            <Button
              key={href}
              asChild
              size="lg"
              variant="outline"
              className="h-10.5 gap-2 px-4"
            >
              <a href={href} target="_blank" rel="noreferrer">
                <Icon className="size-4" />
                {label}
              </a>
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}

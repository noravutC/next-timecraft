import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SectionIntroProps {
  eyebrow: string;
  title: string;
  body?: string;
  /** Small status chip beside the eyebrow, e.g. "Coming soon". */
  badge?: string;
  align?: 'left' | 'center';
  className?: string;
}

/** Mono eyebrow, display heading and lead paragraph that open a section. */
export function SectionIntro({
  eyebrow,
  title,
  body,
  badge,
  align = 'left',
  className,
}: SectionIntroProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3.5',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      <span className="flex items-center gap-2.5 font-mono text-xs leading-6 text-brand">
        {eyebrow}
        {badge && (
          <Badge variant="outline" className="bg-background text-2xs">
            {badge}
          </Badge>
        )}
      </span>
      <h2 className="text-3xl leading-9 font-semibold tracking-tighter text-balance md:text-5xl md:leading-13">
        {title}
      </h2>
      {body && (
        <p className="text-lg leading-6.75 text-pretty text-ink-muted">
          {body}
        </p>
      )}
    </div>
  );
}

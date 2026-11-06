import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** product = /timecraft (44px heading, 17px lead), caseStudy = / (42px, 16px) */
type SectionScale = 'product' | 'caseStudy';

const SCALE_STYLES: Record<SectionScale, { title: string; body: string }> = {
  product: { title: 'text-heading', body: 'text-lg leading-6.75' },
  caseStudy: { title: 'text-heading-sm', body: 'text-copy' },
};

interface SectionIntroProps {
  eyebrow: string;
  title: string;
  body?: string;
  /** Small status chip beside the eyebrow, e.g. "Coming soon". */
  badge?: string;
  align?: 'left' | 'center';
  scale?: SectionScale;
  className?: string;
}

/** Mono eyebrow, display heading and lead paragraph that open a section. */
export function SectionIntro({
  eyebrow,
  title,
  body,
  badge,
  align = 'left',
  scale = 'product',
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
      <h2
        className={cn(
          'font-semibold tracking-tighter text-balance',
          SCALE_STYLES[scale].title,
        )}
      >
        {title}
      </h2>
      {body && (
        <p
          className={cn('text-pretty text-ink-muted', SCALE_STYLES[scale].body)}
        >
          {body}
        </p>
      )}
    </div>
  );
}

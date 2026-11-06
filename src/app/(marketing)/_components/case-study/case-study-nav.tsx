import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SiteHeader } from '../site-header';
import { CASE_STUDY_NAV } from './case-study-content';

export function CaseStudyNav() {
  return (
    <SiteHeader homeHref="/" links={CASE_STUDY_NAV} width="case-study">
      <Button asChild className="text-base">
        <Link href="/login">Open the live board</Link>
      </Button>
    </SiteHeader>
  );
}

import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusScreen } from './_components/status-screen';

export default function NotFound() {
  return (
    <StatusScreen
      tone="neutral"
      icon={<Compass />}
      title="Page not found"
      description="The link may be broken, or the page has moved."
      action={
        <Button size="sm" asChild>
          <Link href="/project">Go to my boards</Link>
        </Button>
      }
    />
  );
}

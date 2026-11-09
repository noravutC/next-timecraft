'use client';

import { Lock } from 'lucide-react';
import { GoogleIcon } from '@/components/auth/google-icon';
import { UserAvatar } from '@/components/people/user-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfileForm } from './use-profile-form';

/** Photo, display name, email and sign-in method. */
export const ProfileDetails = ({ guest }: { guest: boolean }) => {
  const form = useProfileForm();

  return (
    <section
      aria-label="Your details"
      className="flex flex-col gap-5 border-b border-line pb-7"
    >
      <div className="flex items-center gap-4">
        <UserAvatar
          name={form.savedName}
          image={form.avatar}
          seed={form.userId}
          size="xl"
          className="size-16"
          textClassName="text-xl"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-base font-medium text-ink">Photo</span>
          <span className="text-sm text-ink-subtle">
            {guest
              ? 'The guest demo has no photo.'
              : 'Your photo comes from your Google account.'}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pf-name">Display name</Label>
        <Input
          id="pf-name"
          inputSize="lg"
          value={form.name}
          onChange={(e) => form.setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void form.save();
          }}
          disabled={guest}
          maxLength={80}
        />
        <span className="text-xs text-ink-subtle">
          Shown on cards, comments and @mentions.
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pf-email">Email</Label>
        <div className="relative">
          <Input
            id="pf-email"
            type="email"
            inputSize="lg"
            readOnly
            value={form.email}
            className="border-line bg-surface pr-9 text-ink-muted"
          />
          <Lock className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-ink-subtle" />
        </div>
        <span className="text-xs text-ink-subtle">
          {guest
            ? 'Shared by everyone in the demo.'
            : 'The email on your Google account. Board invitations sent to it reach you here.'}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-ink">Signed in with</span>
        <div className="flex min-h-13 items-center gap-3 rounded-popover border border-line px-3.5">
          {!guest && <GoogleIcon className="size-4.5 shrink-0" />}
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-medium text-ink">
              {guest ? 'Guest demo' : 'Google'}
            </span>
            <span className="truncate text-xs text-ink-subtle">
              {form.email}
            </span>
          </span>
          <span className="inline-flex h-5.5 items-center gap-1.25 rounded-full bg-success-soft px-2 text-xs font-medium text-success-text">
            <span className="size-1.5 rounded-full bg-success" />
            Connected
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!form.dirty || form.saving}
          onClick={() => void form.save()}
        >
          {form.saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </section>
  );
};

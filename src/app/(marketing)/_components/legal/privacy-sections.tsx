import type { LegalSection } from './legal-page';
import { OPERATOR } from './legal-facts';
import {
  ContactEmail,
  LegalLink,
  LegalList,
  LegalPoint,
  LegalText,
  ProviderTable,
} from './legal-text';

export const PRIVACY_SUMMARY =
  'TimeCraft keeps what you put on your boards and the basics from your Google sign-in. It doesn’t sell your data, show ads, or use analytics or ad trackers.';

const PROVIDERS = [
  { name: 'Supabase', role: 'Database and file storage, in Singapore.' },
  { name: 'Pusher', role: 'Live updates between people on the same board.' },
  { name: 'Resend', role: 'Sends invitation, mention and reminder emails.' },
  {
    name: 'Anthropic and Google',
    role: 'AI Breakdown. Only the goal you submit is sent.',
  },
  { name: 'Google', role: 'Sign-in.' },
  { name: 'Sentry', role: 'Error reports.' },
  { name: 'Amazon Web Services', role: 'Runs the app servers, in Singapore.' },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'collect',
    title: 'What TimeCraft stores',
    body: (
      <>
        <LegalList>
          <LegalPoint lead="From Google sign-in:">
            your name, email address and profile photo.
          </LegalPoint>
          <LegalPoint lead="What you create:">
            workspaces, boards, columns, tasks, subtasks, comments, reactions
            and the files you attach.
          </LegalPoint>
          <LegalPoint lead="AI Breakdown:">
            how many runs you make and how large they were, to apply the daily
            limit. The goal you type is sent to the AI provider and isn’t kept.
            If you add your own API key, it’s stored encrypted.
          </LegalPoint>
          <LegalPoint lead="Limits:">
            counts of boards created, invitations sent and files uploaded in the
            last day.
          </LegalPoint>
          <LegalPoint lead="Error reports:">
            when something breaks, the page and browser involved, so it can be
            fixed.
          </LegalPoint>
        </LegalList>
        <LegalText>
          Your IP address is used for up to a day to rate-limit sign-ins and the
          guest demo. It isn’t saved with your account.
        </LegalText>
      </>
    ),
  },
  {
    id: 'processors',
    title: 'Services that handle it',
    body: (
      <>
        <LegalText>
          TimeCraft runs on these providers. Each sees only what it needs for
          its job.
        </LegalText>
        <ProviderTable rows={PROVIDERS} />
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <LegalText>
        Only the cookies that keep you signed in, for up to 48 hours at a time.
        No advertising or analytics cookies.
      </LegalText>
    ),
  },
  {
    id: 'guest',
    title: 'The guest demo',
    body: (
      <LegalText>
        Everyone who tries the demo signs in to the same account, so anything
        you add there can be seen and changed by other visitors. Don’t put
        anything private in it. The demo board is reset every night.
      </LegalText>
    ),
  },
  {
    id: 'choices',
    title: 'Your choices',
    body: (
      <LegalList>
        <LegalPoint>
          Change your display name and email preferences in{' '}
          <LegalLink href="/settings/profile">Settings</LegalLink>.
        </LegalPoint>
        <LegalPoint>
          Download a board as CSV or JSON from Board settings › General.
        </LegalPoint>
        <LegalPoint>
          Delete your account from Settings › Profile. You choose what happens
          to the boards you own first.
        </LegalPoint>
        <LegalPoint>
          Anything else, email <ContactEmail />.
        </LegalPoint>
      </LegalList>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    tocLabel: 'Changes',
    body: (
      <LegalText>
        When this page changes, the date at the top changes too.
      </LegalText>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <LegalText>
        TimeCraft is run by {OPERATOR}. Questions about your data go to{' '}
        <ContactEmail />.
      </LegalText>
    ),
  },
];

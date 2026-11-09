import type { LegalSection } from './legal-page';
import { OPERATOR } from './legal-facts';
import {
  ContactEmail,
  LegalLink,
  LegalList,
  LegalPoint,
  LegalText,
} from './legal-text';

export const TERMS_SUMMARY =
  'TimeCraft is free to use. What you put on your boards is yours. Use it fairly, and know that it comes without guarantees.';

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'using',
    title: 'Using TimeCraft',
    body: (
      <LegalText>
        TimeCraft is a board and task app run by {OPERATOR}. Every feature is
        free today. If that changes, you’ll be told before you’re charged for
        anything.
      </LegalText>
    ),
  },
  {
    id: 'account',
    title: 'Your account',
    body: (
      <LegalText>
        You sign in with Google, or try the shared guest demo. Keep your Google
        account safe: what happens under your account is your responsibility.
        Everyone who opens the guest demo shares it, so anything there can be
        seen and changed by others, and it’s reset every night.
      </LegalText>
    ),
  },
  {
    id: 'content',
    title: 'Your content',
    body: (
      <LegalText>
        What you put on your boards stays yours. You let TimeCraft store it and
        show it to the people you share a board or workspace with, only to run
        the service. The <LegalLink href="/privacy">Privacy policy</LegalLink>{' '}
        says what’s kept and where.
      </LegalText>
    ),
  },
  {
    id: 'fair-use',
    title: 'Fair use',
    body: (
      <LegalList>
        <LegalPoint>
          Don’t use TimeCraft to break the law or to harass anyone.
        </LegalPoint>
        <LegalPoint>
          Don’t upload malware, or files you don’t have the right to share.
        </LegalPoint>
        <LegalPoint>
          Don’t work around the daily limits on boards, invitations, uploads and
          AI Breakdown, or try to reach data that isn’t yours.
        </LegalPoint>
        <LegalPoint>
          Don’t overload the service or the guest demo with automated traffic.
        </LegalPoint>
      </LegalList>
    ),
  },
  {
    id: 'ai',
    title: 'AI Breakdown',
    body: (
      <LegalText>
        AI Breakdown suggests subtasks written by Anthropic’s or Google’s
        models. Suggestions can be wrong, so read them before you rely on them.
        If you add your own API key, your use also falls under that provider’s
        terms.
      </LegalText>
    ),
  },
  {
    id: 'availability',
    title: 'No guarantees',
    body: (
      <LegalText>
        TimeCraft is provided as it is, without warranties. It may be down,
        change, or lose data despite the care taken, so keep a copy of anything
        you can’t afford to lose. As far as the law allows, its operator isn’t
        liable for losses that come from using it.
      </LegalText>
    ),
  },
  {
    id: 'ending',
    title: 'Ending',
    body: (
      <LegalText>
        You can delete your account at any time from Settings › Profile. An
        account that breaks these terms may be suspended or removed.
      </LegalText>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    tocLabel: 'Changes',
    body: (
      <LegalText>
        When these terms change, the date at the top changes too. Using
        TimeCraft after a change means you accept the new terms.
      </LegalText>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <LegalText>
        Questions about these terms go to <ContactEmail />.
      </LegalText>
    ),
  },
];

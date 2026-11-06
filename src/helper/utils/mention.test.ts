import { describe, expect, it } from 'vitest';
import { linkMentions, MENTION_HREF } from './mention';

describe('linkMentions', () => {
  it('links known names after @', () => {
    expect(linkMentions('@Noravut can we keep it?', ['Noravut'])).toBe(
      `[@Noravut](${MENTION_HREF}) can we keep it?`,
    );
  });

  it('prefers the longest matching name', () => {
    expect(linkMentions('ping @Ann Lee now', ['Ann', 'Ann Lee'])).toBe(
      `ping [@Ann Lee](${MENTION_HREF}) now`,
    );
  });

  it('ignores emails, unknown names and partial words', () => {
    expect(linkMentions('mail ann@x.com or @Bob', ['Ann'])).toBe(
      'mail ann@x.com or @Bob',
    );
    expect(linkMentions('@Annabel hi', ['Ann'])).toBe('@Annabel hi');
  });

  it('escapes regex characters in names', () => {
    expect(linkMentions('@J.R. done', ['J.R.'])).toBe(
      `[@J.R.](${MENTION_HREF}) done`,
    );
  });
});

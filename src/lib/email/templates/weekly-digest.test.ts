import { render } from '@react-email/components';
import { describe, expect, it } from 'vitest';
import { WeeklyDigestEmail } from './weekly-digest';

const props = {
  boardName: 'Website Relaunch',
  weekLabel: 'Week of Nov 2 to Nov 8',
  tiles: [
    {
      value: '8',
      unit: '',
      label: 'Completed',
      note: '4 more than the week before',
    },
    {
      value: '4.2',
      unit: 'days',
      label: 'Time to done',
      note: 'Median, created to Done',
    },
    { value: '3', unit: '', label: 'Due this week', note: 'None overdue' },
  ],
  finished: [{ title: 'Lazy-load columns', by: 'Ploy S.' }],
  finishedMore: 7,
  attention: [
    {
      label: 'Stuck',
      tone: 'warning' as const,
      title: 'Realtime presence on cards',
      why: 'Review · has not moved for 7 days',
    },
  ],
  attentionMore: 2,
  insightsUrl: 'https://timecraft.example/project?board=b1&view=insights',
};

describe('WeeklyDigestEmail', () => {
  it('shows the week, the numbers, both lists and links to Insights', async () => {
    const html = await render(WeeklyDigestEmail(props));
    expect(html).toContain('Website Relaunch');
    expect(html).toContain('Week of Nov 2 to Nov 8');
    expect(html).toContain('4 more than the week before');
    expect(html).toContain('Finished last week');
    expect(html).toContain('Lazy-load columns');
    expect(html).toContain('and <!-- -->7<!-- --> more');
    expect(html).toContain('Needs attention');
    expect(html).toContain('Review · has not moved for 7 days');
    expect(html).toContain('Open Insights');
    expect(html).toContain('Turn it off');
    expect(html).toContain(
      'href="https://timecraft.example/project?board=b1&amp;view=insights"',
    );
    expect(html).not.toMatch(/[—–]/);
  });

  it('leaves out the lists a quiet week has nothing for', async () => {
    const html = await render(
      WeeklyDigestEmail({
        ...props,
        finished: [],
        finishedMore: 0,
        attention: [],
        attentionMore: 0,
      }),
    );
    expect(html).not.toContain('Finished last week');
    expect(html).not.toContain('Needs attention');
    expect(html).toContain('Open Insights');
  });
});

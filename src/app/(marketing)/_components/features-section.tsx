import { ChartNoAxesColumn, Sparkles, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: ChartNoAxesColumn,
    iconClass: 'bg-brand-soft text-brand',
    title: 'Boards that keep their order',
    body: 'Drag cards and whole columns exactly where you want them — smooth drops with auto-scroll, and an order that stays put even when the whole team is rearranging at once.',
    dark: false,
  },
  {
    icon: Sparkles,
    iconClass: 'bg-white/10 text-brand',
    title: 'AI that breaks down the big stuff',
    body: 'Describe a task and let the built-in AI split it into concrete subtasks, streamed onto the card in seconds — powered by Claude.',
    dark: true,
  },
  {
    icon: Zap,
    iconClass: 'bg-emerald-100 text-emerald-600',
    title: 'Changes land in real time',
    body: 'Boards sync over websockets. Move a card and every teammate sees it instantly — no refresh, no working off a stale plan.',
    dark: false,
  },
  {
    icon: MessageSquare,
    iconClass: 'bg-sky-100 text-sky-600',
    title: 'Everything a task needs',
    body: 'Priorities, due dates, tags, assignees, subtasks, estimated and logged hours — plus comments with attachments and reactions, and notifications so nothing slips past.',
    dark: false,
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl scroll-mt-20 px-7 pt-24 pb-10"
    >
      <div className="mk-reveal mb-12 max-w-xl">
        <div className="mb-3.5 font-mono text-xs tracking-widest text-brand">
          FEATURES
        </div>
        <h2 className="mk-display mb-4 text-3xl leading-tight font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
          A board that keeps the whole team moving.
        </h2>
        <p className="text-lg leading-normal text-ink-muted">
          Most task apps go stale the moment someone stops updating them.
          TimeCraft keeps every card current — for everyone, at once.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className={cn(
              'mk-reveal rounded-2xl p-7 transition-transform duration-200 hover:-translate-y-1',
              feature.dark
                ? 'bg-ink text-white'
                : 'border border-line bg-white hover:shadow-[0_18px_40px_-20px_rgba(29,30,38,0.28)]',
            )}
          >
            <div
              className={cn(
                'mb-4 flex size-11 items-center justify-center rounded-xl',
                feature.iconClass,
              )}
            >
              <feature.icon className="size-5.5" />
            </div>
            <h3 className="mk-display mb-2.5 text-xl font-bold tracking-tight">
              {feature.title}
            </h3>
            <p
              className={cn(
                'text-md leading-relaxed',
                feature.dark ? 'text-white/70' : 'text-ink-muted',
              )}
            >
              {feature.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

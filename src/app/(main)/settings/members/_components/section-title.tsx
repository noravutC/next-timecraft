/** "Members 3": a small heading with a count. */
export const SectionTitle = ({
  id,
  title,
  count,
}: {
  id: string;
  title: string;
  count?: number;
}) => (
  <h2 id={id} className="flex items-center gap-2 text-sm font-medium text-ink">
    {title}
    {count !== undefined && (
      <span className="font-mono text-xs font-normal text-ink-subtle">
        {count}
      </span>
    )}
  </h2>
);

/** Title and one line under it, at the top of every settings page. */
export const SettingsHeading = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
    <p className="text-base text-ink-subtle">{children}</p>
  </div>
);

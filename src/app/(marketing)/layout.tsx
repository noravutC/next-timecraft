export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full overflow-x-clip overflow-y-auto scroll-smooth bg-background text-ink antialiased">
      {children}
    </div>
  );
}

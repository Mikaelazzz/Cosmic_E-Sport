export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="moderator-layout px-4 py-[72px] md:py-12 md:px-12">
      {children}
    </div>
  );
}
export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="moderator-layout px-12 py-12">
      {children}
    </div>
  );
}
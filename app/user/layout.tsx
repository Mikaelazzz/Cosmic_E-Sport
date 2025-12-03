export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="user-layout px-4 py-[72px] md:py-12 md:px-12">
      {children}
    </div>
  );
}
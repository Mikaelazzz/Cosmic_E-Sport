export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="user-layout px-12 py-12">
      {children}
    </div>
  );
}
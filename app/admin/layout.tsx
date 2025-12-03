export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout px-12 py-12">
      {children}
    </div>
  );
}
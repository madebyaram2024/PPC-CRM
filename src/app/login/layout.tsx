export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Login page should not use the main layout with navigation
  return <>{children}</>;
}
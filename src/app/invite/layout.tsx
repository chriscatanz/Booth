// Force dynamic rendering - don't prerender this page
export const dynamic = 'force-dynamic';

export default function InviteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

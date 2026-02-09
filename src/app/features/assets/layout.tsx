import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trade Show Asset Management - Booth',
  description: 'Track booth kits, displays, and collateral. Reservation system, inventory tracking, and low stock alerts.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { AdminPanel } from '@/components/admin';

export default function AdminPage() {
  const router = useRouter();
  const { isSuperAdmin, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isSuperAdmin)) {
      router.replace('/');
    }
  }, [isAuthenticated, isSuperAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return <AdminPanel />;
}

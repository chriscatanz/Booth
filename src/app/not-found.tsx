'use client';

import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="text-center max-w-md space-y-6"
      >
        {/* 404 Illustration */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          className="relative"
        >
          <div className="text-8xl font-bold text-brand-purple/20 select-none">
            404
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="p-3 rounded-full bg-brand-purple/10">
              <Search size={40} className="text-brand-purple" />
            </div>
          </motion.div>
        </motion.div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">
            Page Not Found
          </h1>
          <p className="text-text-secondary">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-purple-dark text-white font-semibold shadow-sm hover:shadow-lg hover:shadow-brand-purple/25 transition-all min-h-[44px] cursor-pointer"
            >
              <Home size={16} />
              Go to Dashboard
            </motion.span>
          </Link>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bg-tertiary text-text-primary font-semibold hover:bg-border-subtle transition-colors min-h-[44px]"
          >
            <ArrowLeft size={16} />
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

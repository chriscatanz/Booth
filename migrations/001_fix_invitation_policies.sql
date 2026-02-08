-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: Replace auth.users subqueries with auth.email() function
-- 
-- The original policies tried to query auth.users directly which is blocked
-- by Supabase RLS. Use auth.email() instead.
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their invitations by email" ON public.invitations;
DROP POLICY IF EXISTS "Users can accept invitations" ON public.invitations;

-- Recreate with auth.email() instead of subquery
CREATE POLICY "Users can view their invitations by email" ON public.invitations
  FOR SELECT USING (
    lower(email) = lower(auth.email())
  );

CREATE POLICY "Users can accept invitations" ON public.invitations
  FOR UPDATE USING (
    lower(email) = lower(auth.email())
  );

-- Verify policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'invitations';

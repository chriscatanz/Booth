-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 022: Allow anon users to view organization names for pending invites
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Problem: When a user clicks an invitation link, they're not logged in (anon role).
-- The fetchInvitationByToken query joins with organizations(*), but the anon role
-- can't see any organizations due to RLS, causing the entire query to fail.
--
-- Solution: Allow anon users to SELECT organizations that have active pending invites.
-- This is safe because:
-- 1. Only exposes orgs with pending invites (not all orgs)
-- 2. Only for SELECT (can't modify)
-- 3. Invites expire after 7 days anyway
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop if exists (idempotent)
DROP POLICY IF EXISTS "Anon can view org for pending invite" ON public.organizations;

-- Allow anonymous users to see organization info for pending invitations
CREATE POLICY "Anon can view org for pending invite" ON public.organizations
  FOR SELECT 
  USING (
    id IN (
      SELECT organization_id 
      FROM public.invitations 
      WHERE accepted_at IS NULL 
        AND expires_at > NOW()
    )
  );

-- Grant SELECT to anon role (may already exist, but ensure it's there)
GRANT SELECT ON public.organizations TO anon;

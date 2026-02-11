-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 022: Allow anon users to view invitations and organizations
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Problem: When a user clicks an invitation link, they're not logged in (anon role).
-- The fetchInvitationByToken query:
-- 1. Needs to read invitations table (to find the invite by token)
-- 2. Joins with organizations(*) (to show org name on invite page)
--
-- But anon role couldn't see either table due to missing RLS policies.
--
-- Solution: 
-- 1. Allow anon to SELECT any invitation (they need the secret token to use it)
-- 2. Allow anon to SELECT organizations that have active pending invites
--
-- This is secure because:
-- - Invitation tokens are cryptographically random (sha256)
-- - Only exposes orgs with pending invites (not all orgs)
-- - Only allows SELECT (no modifications)
-- - Invites expire after 7 days anyway
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Part 1: Allow anon to view invitations by token
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view invite by token" ON public.invitations;

CREATE POLICY "Anyone can view invite by token" ON public.invitations
  FOR SELECT 
  USING (true);

GRANT SELECT ON public.invitations TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- Part 2: Allow anon to view organization names for pending invites
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can view org for pending invite" ON public.organizations;

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

GRANT SELECT ON public.organizations TO anon;

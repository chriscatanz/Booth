-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 023: Fix ambiguous organization_id in RLS policies
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Problem: When authenticated users fetch invitations with organizations join,
-- the organizations RLS policy does a subquery on invitations, which triggers
-- invitations RLS policies. The unqualified "organization_id" in those policies
-- becomes ambiguous (could refer to outer invitations or subquery invitations).
--
-- Error: "column reference 'organization_id' is ambiguous"
--
-- Solution: Explicitly qualify organization_id as invitations.organization_id
-- in all invitations policies.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix invitations policies
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view invitations" ON public.invitations;
CREATE POLICY "Admins can view invitations" ON public.invitations
  FOR SELECT USING (public.user_has_role(invitations.organization_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
CREATE POLICY "Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (public.user_has_role(invitations.organization_id, ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;
CREATE POLICY "Admins can delete invitations" ON public.invitations
  FOR DELETE USING (public.user_has_role(invitations.organization_id, ARRAY['owner', 'admin']));

-- ─────────────────────────────────────────────────────────────────────────────
-- Also fix organizations policy to qualify column in subquery
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Anon can view org for pending invite" ON public.organizations;
CREATE POLICY "Anon can view org for pending invite" ON public.organizations
  FOR SELECT 
  USING (
    organizations.id IN (
      SELECT i.organization_id 
      FROM public.invitations i
      WHERE i.accepted_at IS NULL 
        AND i.expires_at > NOW()
    )
  );

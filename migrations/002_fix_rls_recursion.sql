-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: Infinite recursion in RLS policies
-- ═══════════════════════════════════════════════════════════════════════════
-- Problem: user_profiles policy queries organization_members, which triggers 
--          its own RLS check, causing infinite recursion.
-- Solution: Use SECURITY DEFINER functions that bypass RLS.

-- Helper function: Check if user is in same org as target user
-- Uses SECURITY DEFINER to bypass RLS and prevent recursion
CREATE OR REPLACE FUNCTION public.users_share_org(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organization_members m1
    JOIN public.organization_members m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = auth.uid()
    AND m2.user_id = target_user_id
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop old policy
DROP POLICY IF EXISTS "Users can view org member profiles" ON public.user_profiles;

-- Create new policy using the helper function
CREATE POLICY "Users can view org member profiles" ON public.user_profiles
  FOR SELECT USING (
    id = auth.uid() OR public.users_share_org(id)
  );

-- Also ensure get_user_org_ids has SET clause for extra safety
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Ensure user_has_role also has SET clause
CREATE OR REPLACE FUNCTION public.user_has_role(org_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND role = ANY(allowed_roles)
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

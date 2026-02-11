-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 024: Fix RLS recursion and ambiguous column references
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Problems fixed:
-- 1. Infinite recursion in organization_members RLS policy
-- 2. Ambiguous "organization_id" column references in invitations policies
-- 3. Ambiguous column references in accept_invitation function
--
-- Solutions:
-- 1. Create SECURITY DEFINER helper functions to bypass RLS
-- 2. Use fully qualified column names (table.column) in policies
-- 3. Rewrite accept_invitation with local variables to avoid ambiguity
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Helper function for admin checks (bypasses RLS)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_org_admin(check_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members 
    WHERE user_id = auth.uid() 
      AND organization_id = check_org_id
      AND role = ANY(ARRAY['owner', 'admin'])
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fix organization_members policies (infinite recursion fix)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can manage members" ON public.organization_members;
CREATE POLICY "Admins can manage members" ON public.organization_members
  FOR ALL USING (
    public.is_org_admin(organization_members.organization_id)
  );

DROP POLICY IF EXISTS "Users can view org members" ON public.organization_members;
CREATE POLICY "Users can view org members" ON public.organization_members
  FOR SELECT USING (
    organization_members.organization_id IN (SELECT public.get_user_org_ids())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Fix invitations policies (ambiguous column fix)
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can view invitations" ON public.invitations;
CREATE POLICY "Admins can view invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = ANY(ARRAY['owner', 'admin'])
    )
  );

DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
CREATE POLICY "Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = ANY(ARRAY['owner', 'admin'])
    )
  );

DROP POLICY IF EXISTS "Admins can delete invitations" ON public.invitations;
CREATE POLICY "Admins can delete invitations" ON public.invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = ANY(ARRAY['owner', 'admin'])
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Fix accept_invitation function (ambiguous column fix)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.accept_invitation(
    p_token TEXT,
    p_user_id UUID
)
RETURNS TABLE(
    success BOOLEAN,
    organization_id UUID,
    role TEXT,
    error TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
    v_org_id UUID;
    v_role TEXT;
BEGIN
    -- Lock and fetch invitation atomically
    SELECT i.id, i.organization_id, i.role, i.accepted_at, i.expires_at, o.name as org_name
    INTO v_invitation
    FROM invitations i
    JOIN organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
    FOR UPDATE OF i SKIP LOCKED;
    
    -- Check if invitation exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Invitation not found or already being processed';
        RETURN;
    END IF;
    
    -- Store values to avoid ambiguity with return column names
    v_org_id := v_invitation.organization_id;
    v_role := v_invitation.role;
    
    -- Check if already accepted
    IF v_invitation.accepted_at IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Invitation already used';
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_invitation.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Invitation has expired';
        RETURN;
    END IF;
    
    -- Check if user already member (fully qualified)
    IF EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = v_org_id
        AND om.user_id = p_user_id
    ) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Already a member of this organization';
        RETURN;
    END IF;
    
    -- Mark invitation as accepted
    UPDATE invitations inv
    SET accepted_at = NOW()
    WHERE inv.token = p_token AND inv.accepted_at IS NULL;
    
    -- Verify the update happened (race condition check)
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Invitation was accepted by another request';
        RETURN;
    END IF;
    
    -- Add user to organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, p_user_id, v_role);
    
    -- Return success (use local variables to avoid ambiguity with return column names)
    RETURN QUERY SELECT TRUE, v_org_id, v_role, NULL::TEXT;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════════

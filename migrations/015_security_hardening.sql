-- Migration: Security Hardening
-- Addresses: Rate limiting, org creation limits, invitation atomicity

-- ============================================
-- 1. RATE LIMITING TABLE (persistent, not in-memory)
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,           -- e.g., 'invite:user_id' or 'ai:user_id'
    count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_seconds INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

-- RLS for rate_limits (service role only)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Service role only" ON rate_limits
    FOR ALL USING (auth.role() = 'service_role');

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_key TEXT,
    p_limit INTEGER DEFAULT 10,
    p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_record rate_limits%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Try to get existing record
    SELECT * INTO v_record FROM rate_limits WHERE key = p_key FOR UPDATE;
    
    IF NOT FOUND THEN
        -- Create new record
        INSERT INTO rate_limits (key, count, window_start, window_seconds)
        VALUES (p_key, 1, v_now, p_window_seconds);
        RETURN TRUE;
    END IF;
    
    -- Check if window has expired
    IF v_now > v_record.window_start + (v_record.window_seconds || ' seconds')::INTERVAL THEN
        -- Reset window
        UPDATE rate_limits 
        SET count = 1, window_start = v_now, window_seconds = p_window_seconds
        WHERE key = p_key;
        RETURN TRUE;
    END IF;
    
    -- Check if under limit
    IF v_record.count < p_limit THEN
        UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
        RETURN TRUE;
    END IF;
    
    -- Rate limited
    RETURN FALSE;
END;
$$;

-- Cleanup old rate limit records (run periodically)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM rate_limits 
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;


-- ============================================
-- 2. ORGANIZATION CREATION LIMITS
-- ============================================

-- Function to count user's organizations
CREATE OR REPLACE FUNCTION count_user_organizations(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT COUNT(*)::INTEGER
    FROM organization_members
    WHERE user_id = p_user_id AND role = 'owner';
$$;

-- Function to check if user can create org (limit: 5 orgs per user)
CREATE OR REPLACE FUNCTION can_create_organization(p_user_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT count_user_organizations(p_user_id) < p_limit;
$$;

-- Update organization insert policy to include limit check
DROP POLICY IF EXISTS "Users can create orgs" ON organizations;
CREATE POLICY "Users can create orgs with limit" ON organizations
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL 
        AND can_create_organization(auth.uid(), 5)
    );


-- ============================================
-- 3. ATOMIC INVITATION ACCEPTANCE
-- ============================================

-- Add accepted_at column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations' AND column_name = 'accepted_at'
    ) THEN
        ALTER TABLE invitations ADD COLUMN accepted_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add unique constraint to prevent double-use
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'invitations_token_accepted_unique'
    ) THEN
        -- Ensure each token can only be accepted once
        CREATE UNIQUE INDEX invitations_accepted_once 
        ON invitations (token) 
        WHERE accepted_at IS NOT NULL;
    END IF;
END $$;

-- Atomic invitation acceptance function
CREATE OR REPLACE FUNCTION accept_invitation(
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
BEGIN
    -- Lock and fetch invitation atomically
    SELECT i.*, o.name as org_name
    INTO v_invitation
    FROM invitations i
    JOIN organizations o ON o.id = i.organization_id
    WHERE i.token = p_token
    FOR UPDATE SKIP LOCKED;
    
    -- Check if invitation exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Invitation not found or already being processed';
        RETURN;
    END IF;
    
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
    
    -- Check if user already member
    IF EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = v_invitation.organization_id 
        AND user_id = p_user_id
    ) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Already a member of this organization';
        RETURN;
    END IF;
    
    -- Mark invitation as accepted
    UPDATE invitations 
    SET accepted_at = NOW()
    WHERE token = p_token AND accepted_at IS NULL;
    
    -- Verify the update happened (race condition check)
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, 'Invitation was accepted by another request';
        RETURN;
    END IF;
    
    -- Add user to organization
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_invitation.organization_id, p_user_id, v_invitation.role);
    
    -- Return success
    RETURN QUERY SELECT TRUE, v_invitation.organization_id, v_invitation.role, NULL::TEXT;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION accept_invitation(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated;


-- ============================================
-- 4. CLEANUP CRON JOB (if pg_cron available)
-- ============================================

-- Schedule cleanup every hour (only if pg_cron extension exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Remove old job if exists
        PERFORM cron.unschedule('cleanup-rate-limits');
        -- Schedule new job
        PERFORM cron.schedule(
            'cleanup-rate-limits',
            '0 * * * *',  -- Every hour
            'SELECT cleanup_rate_limits()'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- pg_cron not available, skip
    NULL;
END $$;

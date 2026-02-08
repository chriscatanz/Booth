-- Migration 003: Audit Log for Compliance
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════════════════════════════════
-- Audit Log Table
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  
  -- What happened
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  
  -- Additional context
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- Composite index for filtered queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON audit_log(organization_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit log
DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
CREATE POLICY "Admins can view audit log" ON audit_log
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Any authenticated user can insert (logging their own actions)
DROP POLICY IF EXISTS "Users can log actions" ON audit_log;
CREATE POLICY "Users can log actions" ON audit_log
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Automatic Audit Triggers (Optional - for critical actions)
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to log trade show changes
CREATE OR REPLACE FUNCTION log_tradeshow_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name)
    VALUES (NEW.organization_id, NEW.created_by, 'create', 'tradeshow', NEW.id::TEXT, NEW.name);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name, metadata)
    VALUES (
      NEW.organization_id, 
      auth.uid(), 
      'update', 
      'tradeshow', 
      NEW.id::TEXT, 
      NEW.name,
      jsonb_build_object('changes', 'updated')
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name)
    VALUES (OLD.organization_id, auth.uid(), 'delete', 'tradeshow', OLD.id::TEXT, OLD.name);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to tradeshows (split for INSERT/UPDATE vs DELETE)
DROP TRIGGER IF EXISTS tradeshow_audit_trigger ON tradeshows;
DROP TRIGGER IF EXISTS tradeshow_audit_insert_update ON tradeshows;
DROP TRIGGER IF EXISTS tradeshow_audit_delete ON tradeshows;

CREATE TRIGGER tradeshow_audit_insert_update
  AFTER INSERT OR UPDATE ON tradeshows
  FOR EACH ROW
  WHEN (NEW.organization_id IS NOT NULL)
  EXECUTE FUNCTION log_tradeshow_changes();

CREATE TRIGGER tradeshow_audit_delete
  AFTER DELETE ON tradeshows
  FOR EACH ROW
  WHEN (OLD.organization_id IS NOT NULL)
  EXECUTE FUNCTION log_tradeshow_changes();

-- Function to log member changes
CREATE OR REPLACE FUNCTION log_member_changes()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM user_profiles WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name, metadata)
    VALUES (
      NEW.organization_id, 
      NEW.invited_by, 
      'member_added', 
      'member', 
      NEW.user_id::TEXT, 
      user_email,
      jsonb_build_object('role', NEW.role)
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name, metadata)
    VALUES (
      NEW.organization_id, 
      auth.uid(), 
      'role_changed', 
      'member', 
      NEW.user_id::TEXT, 
      user_email,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, resource_name)
    VALUES (OLD.organization_id, auth.uid(), 'member_removed', 'member', OLD.user_id::TEXT, user_email);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to organization_members
DROP TRIGGER IF EXISTS member_audit_trigger ON organization_members;
CREATE TRIGGER member_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION log_member_changes();

-- ═══════════════════════════════════════════════════════════════════════════
-- Retention Policy (Optional - delete old logs)
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to clean up old audit logs (run via pg_cron or manually)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Example: Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-audit-log', '0 3 * * 0', 'SELECT cleanup_old_audit_logs(365)');

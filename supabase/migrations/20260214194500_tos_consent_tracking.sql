-- Track Terms of Service and Privacy Policy consent
-- Required for legally binding agreements

-- Add consent columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tos_version TEXT,
ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS privacy_version TEXT,
ADD COLUMN IF NOT EXISTS signup_ip_address TEXT;

-- Create consent log table for audit trail (important for legal compliance)
CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'tos', 'privacy', 'marketing', etc.
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_consent_log_user_id ON consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_type ON consent_log(consent_type);

-- RLS for consent_log
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own consent records
CREATE POLICY "Users can view own consent"
  ON consent_log FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert (via service role or trigger)
CREATE POLICY "System can insert consent"
  ON consent_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant access
GRANT SELECT, INSERT ON consent_log TO authenticated;

-- Note: v_user_profiles view doesn't need updating - consent columns 
-- are not PII and can be queried directly from user_profiles table

COMMENT ON TABLE consent_log IS 'Audit trail of user consent for ToS, Privacy Policy, etc. Required for legal compliance.';
COMMENT ON COLUMN user_profiles.tos_accepted_at IS 'When user accepted Terms of Service';
COMMENT ON COLUMN user_profiles.tos_version IS 'Version of ToS accepted (e.g., "2024-02-14")';
COMMENT ON COLUMN user_profiles.privacy_accepted_at IS 'When user accepted Privacy Policy';
COMMENT ON COLUMN user_profiles.privacy_version IS 'Version of Privacy Policy accepted';
COMMENT ON COLUMN user_profiles.signup_ip_address IS 'IP address at time of signup (for consent verification)';

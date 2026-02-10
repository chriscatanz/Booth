-- Migration: Fix View Security
-- Sets security_invoker = true on all decryption views to enforce RLS of the querying user

-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: Set security_invoker on decryption views
-- This ensures RLS policies of the querying user are enforced, not bypassed
-- ═══════════════════════════════════════════════════════════════════════════

-- v_tradeshows
ALTER VIEW public.v_tradeshows SET (security_invoker = true);

-- v_user_profiles  
ALTER VIEW public.v_user_profiles SET (security_invoker = true);

-- v_attendees
ALTER VIEW public.v_attendees SET (security_invoker = true);

-- v_invitations
ALTER VIEW public.v_invitations SET (security_invoker = true);

-- v_organization_ai_settings already has this set (migration 014)

COMMENT ON VIEW public.v_tradeshows IS 'Decrypted tradeshows view - security_invoker enforces RLS';
COMMENT ON VIEW public.v_user_profiles IS 'Decrypted user profiles view - security_invoker enforces RLS';
COMMENT ON VIEW public.v_attendees IS 'Decrypted attendees view - security_invoker enforces RLS';
COMMENT ON VIEW public.v_invitations IS 'Decrypted invitations view - security_invoker enforces RLS';

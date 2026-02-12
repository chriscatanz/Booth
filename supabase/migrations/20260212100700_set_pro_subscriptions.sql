-- Set Pro subscriptions for Dopamine Design Labs and Directlink orgs

-- Update existing subscriptions to Pro
UPDATE subscriptions
SET 
  tier = 'pro',
  status = 'active',
  trial_ends_at = NULL,
  current_period_end = '2099-12-31'::timestamptz,
  updated_at = now()
WHERE org_id IN (
  SELECT id FROM organizations 
  WHERE name ILIKE '%dopamine%' OR name ILIKE '%directlink%'
);

-- If no subscription exists, create one
INSERT INTO subscriptions (org_id, tier, status, current_period_end)
SELECT o.id, 'pro', 'active', '2099-12-31'::timestamptz
FROM organizations o
WHERE (o.name ILIKE '%dopamine%' OR o.name ILIKE '%directlink%')
  AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.org_id = o.id)
ON CONFLICT (org_id) DO UPDATE SET
  tier = 'pro',
  status = 'active',
  current_period_end = '2099-12-31'::timestamptz,
  updated_at = now();

-- Show results
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT o.name, s.tier, s.status 
    FROM organizations o
    JOIN subscriptions s ON s.org_id = o.id
    WHERE o.name ILIKE '%dopamine%' OR o.name ILIKE '%directlink%'
  LOOP
    RAISE NOTICE 'Set to Pro: % -> % (%)', rec.name, rec.tier, rec.status;
  END LOOP;
END $$;

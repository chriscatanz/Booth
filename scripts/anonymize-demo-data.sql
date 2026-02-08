-- ═══════════════════════════════════════════════════════════════════════════
-- Anonymize Demo Data
-- Run this in Supabase SQL Editor to replace real names/emails with fake ones
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Fake Data Arrays ───────────────────────────────────────────────────────

-- First names
CREATE OR REPLACE FUNCTION random_first_name() RETURNS TEXT AS $$
DECLARE
  names TEXT[] := ARRAY[
    'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery',
    'Cameron', 'Dakota', 'Skyler', 'Reese', 'Finley', 'Sage', 'River', 'Phoenix',
    'Jamie', 'Drew', 'Blake', 'Hayden', 'Emerson', 'Rowan', 'Parker', 'Sawyer',
    'Charlie', 'Kendall', 'Logan', 'Peyton', 'Spencer', 'Sydney', 'Adrian', 'Jesse'
  ];
BEGIN
  RETURN names[1 + floor(random() * array_length(names, 1))::int];
END;
$$ LANGUAGE plpgsql;

-- Last names
CREATE OR REPLACE FUNCTION random_last_name() RETURNS TEXT AS $$
DECLARE
  names TEXT[] := ARRAY[
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker',
    'Hall', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Nelson'
  ];
BEGIN
  RETURN names[1 + floor(random() * array_length(names, 1))::int];
END;
$$ LANGUAGE plpgsql;

-- Company suffixes for emails
CREATE OR REPLACE FUNCTION random_company() RETURNS TEXT AS $$
DECLARE
  companies TEXT[] := ARRAY[
    'acme', 'globex', 'initech', 'hooli', 'piedpiper', 'waystar', 'dunder', 'sterling',
    'oceanic', 'umbrella', 'stark', 'wayne', 'lexcorp', 'cyberdyne', 'weyland', 'aperture'
  ];
BEGIN
  RETURN companies[1 + floor(random() * array_length(companies, 1))::int];
END;
$$ LANGUAGE plpgsql;

-- Conference name generator
CREATE OR REPLACE FUNCTION random_conference_name() RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['National', 'Annual', 'International', 'Regional', 'Global'];
  topics TEXT[] := ARRAY[
    'Banking', 'Finance', 'Credit Union', 'Fintech', 'Digital Banking',
    'Community Banking', 'Innovation', 'Technology', 'Leadership', 'Growth'
  ];
  suffixes TEXT[] := ARRAY['Summit', 'Conference', 'Expo', 'Forum', 'Convention', 'Symposium'];
BEGIN
  RETURN prefixes[1 + floor(random() * array_length(prefixes, 1))::int] || ' ' ||
         topics[1 + floor(random() * array_length(topics, 1))::int] || ' ' ||
         suffixes[1 + floor(random() * array_length(suffixes, 1))::int];
END;
$$ LANGUAGE plpgsql;

-- ─── Anonymize Attendees ────────────────────────────────────────────────────

UPDATE attendees SET
  name = random_first_name() || ' ' || random_last_name(),
  email = lower(random_first_name()) || '.' || lower(random_last_name()) || '@' || random_company() || '.com',
  flight_confirmation = upper(substr(md5(random()::text), 1, 6));

-- ─── Anonymize User Profiles ────────────────────────────────────────────────
-- NOTE: Excludes YOUR account so you can still log in!
-- Replace 'your-email@example.com' with your actual email to protect it

UPDATE user_profiles SET
  full_name = random_first_name() || ' ' || random_last_name(),
  email = lower(random_first_name()) || '.' || lower(random_last_name()) || '@' || random_company() || '.com',
  phone = '555-' || lpad((random() * 999)::int::text, 3, '0') || '-' || lpad((random() * 9999)::int::text, 4, '0'),
  job_title = (ARRAY['Account Manager', 'Sales Rep', 'Marketing Director', 'Event Coordinator', 'VP Sales', 'Regional Manager'])[1 + floor(random() * 6)::int]
WHERE email NOT LIKE '%@directlink.ai%';  -- Keeps your Directlink accounts safe

-- ─── Anonymize Tradeshow Names (Optional - uncomment if needed) ─────────────

-- UPDATE tradeshows SET
--   name = random_conference_name();

-- ─── Cleanup Helper Functions ───────────────────────────────────────────────

DROP FUNCTION IF EXISTS random_first_name();
DROP FUNCTION IF EXISTS random_last_name();
DROP FUNCTION IF EXISTS random_company();
DROP FUNCTION IF EXISTS random_conference_name();

-- ─── Summary ────────────────────────────────────────────────────────────────

SELECT 
  (SELECT COUNT(*) FROM attendees) AS attendees_anonymized,
  (SELECT COUNT(*) FROM user_profiles WHERE email NOT LIKE '%@directlink.ai%') AS users_anonymized,
  (SELECT COUNT(*) FROM tradeshows) AS tradeshows_total;

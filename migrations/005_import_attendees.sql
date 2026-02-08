-- Migration 005: Import attendees
-- Maps old tradeshow_id to new UUID by matching show names

-- Create a temp mapping table
CREATE TEMP TABLE old_show_mapping (
  old_id TEXT,
  show_name TEXT
);

INSERT INTO old_show_mapping (old_id, show_name) VALUES
('4', 'Jack Henry Connect 2025 (Directlink)'),
('6', 'ACU OME & Tech (IMS/DL)'),
('7', 'SHAZAM User Group Meeting'),
('8', 'CCUA APEX (IMS/DL)'),
('9', 'ICUCCC 2026'),
('10', '2025 Deda Pulse Conference'),
('19', 'Jack Henry Connect 2025 (IMS)'),
('24', 'IBANYS Annual Convention 2025'),
('25', 'DCI Bankers Conference 2026'),
('26', 'DRJ Spring 2026 (IMS)'),
('27', 'ICBA Live 2026'),
('28', 'ACU GAC (DL)'),
('29', 'Corelation Conference '),
('30', 'COCC Amplify 2026'),
('31', 'IBANYS Convention 2026'),
('33', 'CertaPro Painters Annual Conference (IMS)'),
('34', 'Silverlake Mid-Atlantic User Group Conf'),
('35', 'NBS Pitching Innovation'),
('36', 'ACU GAC (IMS)'),
('41', 'inVest48 (IMS)'),
('42', 'JHUGS 2026'),
('43', 'SHAZAM: Power of Partnership Forum'),
('47', 'Corelation Staffing Event'),
('52', 'NYCUA EXCEL 26'),
('53', 'Georgia Bankers Assoc. Annual Conference'),
('54', 'IBANYS Spring Meeting (VIRTUAL MEETING)'),
('56', 'NYBA Business of Banking Conference');

-- Insert attendees with mapped tradeshow_id
INSERT INTO attendees (tradeshow_id, name, email, arrival_date, departure_date, flight_cost)
SELECT 
  t.id,
  a.name,
  a.email,
  a.arrival_date::DATE,
  a.departure_date::DATE,
  a.flight_cost::NUMERIC
FROM (
  VALUES
    ('24', 'Ben Nichols', 'ben@directlink.ai', NULL, NULL, NULL),
    ('24', 'Brody Guido', 'brody@directlinl.ai', NULL, NULL, NULL),
    ('19', 'Fran Coudriet', 'fcoudriet@imsdirect.com', NULL, NULL, NULL),
    ('19', 'John Pryslak', 'jpryslak@imsdirect.com', NULL, NULL, NULL),
    ('19', 'Joe Kalaska', 'jkalaska@imsdirect.com', NULL, NULL, NULL),
    ('4', 'Chris Catanzarite', 'chris@directlink.ai', NULL, NULL, NULL),
    ('4', 'Ben Nichols', 'ben@directlink.ai', NULL, NULL, NULL),
    ('4', 'Mark Vanderpool', 'mark@directlink.ai', NULL, NULL, NULL),
    ('4', 'Brody Guido', 'brody@directlink.ai', NULL, NULL, NULL),
    ('6', 'Stu Lisabeth', 'slisabeth@imsdirect.com', NULL, NULL, NULL),
    ('6', 'Brody Guido', 'brody@directlink.ai', NULL, NULL, NULL),
    ('6', 'John Pryslak', 'jpryslak@imsdirect.com', NULL, NULL, NULL),
    ('7', 'Mark Vanderpool', 'mark@directlink.ai', NULL, NULL, NULL),
    ('7', 'Brody Guido', 'brody@directlink.ai', NULL, NULL, NULL),
    ('9', 'Chris Catanzarite', 'chris@directlink.ai', '2025-10-19', '2025-10-22', NULL),
    ('9', 'Brody Guido', 'brody@directlink.ai', '2025-10-19', '2025-10-22', NULL),
    ('10', 'Ben Nichols', 'ben@directlink.ai', '2025-10-26', '2025-10-29', NULL),
    ('10', 'Mark Vanderpool', 'mark@directlink.ai', '2025-10-26', '2025-10-29', NULL),
    ('10', 'John Pryslak', 'jpryslak@imsdirect.com', '2025-10-26', '2025-10-29', NULL),
    ('27', 'Chris Catanzarite', 'chris@directlink.ai', '2026-03-05', '2026-03-08', NULL),
    ('27', 'John Pryslak', 'jpryslak@imsdirect.com', '2026-03-04', '2026-03-08', NULL),
    ('33', 'Brian Basta', 'bbasta@imsdirect.com', NULL, NULL, NULL),
    ('36', 'Joe Kalaska', 'jkalaska@imsdirect.com', '2026-03-01', '2026-03-03', NULL),
    ('36', 'Fran Coudriet', 'fcoudriet@imsdirect.com', '2026-03-01', '2026-03-03', NULL),
    ('8', 'tet1', 'test@test', NULL, NULL, NULL),
    ('8', 'test3', 'test@test', NULL, NULL, NULL),
    ('47', 'Mark Vanderpool', 'mark@directlink.ai', NULL, NULL, NULL),
    ('47', 'Ben Nichols', 'ben@directlink.ai', NULL, NULL, NULL),
    ('25', 'Ben Nichols', 'ben@directlink.ai', '2026-04-14', '2026-04-16', NULL),
    ('25', 'John Pryslak', 'jpryslak@imsdirect.com', '2026-04-14', '2026-04-16', NULL),
    ('43', 'Brody Guido', 'brody@directlink.ai', '2026-04-13', '2026-04-16', NULL),
    ('43', 'Mark Vanderpool', 'mark@directlink.ai', '2026-04-13', '2026-04-16', NULL),
    ('30', 'Brody Guido', NULL, NULL, NULL, NULL),
    ('30', 'John Pryslak', NULL, NULL, NULL, NULL),
    ('31', 'Brody Guido', NULL, NULL, NULL, NULL),
    ('34', 'Chris Catanzarite', NULL, NULL, NULL, NULL),
    ('34', 'Brody Guido', NULL, NULL, NULL, NULL),
    ('26', 'Mark Vanderpool', NULL, NULL, NULL, NULL),
    ('26', 'Fran Coudriet', NULL, NULL, NULL, NULL),
    ('52', 'John Pryslak', NULL, '2026-06-11', '2026-06-12', NULL),
    ('35', 'Ben Nichols', NULL, NULL, NULL, NULL),
    ('35', 'Mark Vanderpool', NULL, NULL, NULL, NULL),
    ('41', 'John Pryslak', NULL, '2026-04-19', '2026-04-22', NULL),
    ('28', 'John Pryslak', NULL, '2026-03-01', '2026-03-03', NULL),
    ('28', 'Brody Guido', NULL, '2026-03-01', '2026-03-03', NULL),
    ('29', 'Brody Guido', NULL, '2026-05-12', '2026-05-16', NULL),
    ('29', 'Mark Vanderpool', NULL, '2026-05-12', '2026-05-16', NULL),
    ('29', 'John Pryslak', NULL, '2026-05-12', '2026-05-16', NULL),
    ('29', 'Fran Coudriet', NULL, '2026-05-12', '2026-05-16', NULL),
    ('41', 'Fran Coudriet', NULL, '2026-04-19', '2026-04-22', NULL),
    ('42', 'Brody Guido', NULL, '2026-03-23', '2026-03-25', NULL),
    ('42', 'John Pryslak', NULL, '2026-03-23', '2026-03-25', NULL),
    ('53', 'Chris Catanzarite', NULL, NULL, NULL, NULL),
    ('53', 'Ben Nichols', NULL, NULL, NULL, NULL),
    ('53', 'Mark Vanderpool', NULL, NULL, NULL, NULL),
    ('54', 'Ben Nichols', NULL, NULL, NULL, NULL),
    ('56', 'Ben Nichols', NULL, NULL, NULL, NULL),
    ('56', 'Brody Gudio', NULL, NULL, NULL, NULL)
) AS a(old_id, name, email, arrival_date, departure_date, flight_cost)
JOIN old_show_mapping m ON m.old_id = a.old_id
JOIN tradeshows t ON t.name = m.show_name;

-- Cleanup
DROP TABLE old_show_mapping;

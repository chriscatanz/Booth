-- Migration: 017_agenda_content.sql
-- Add agenda content field for storing manual agenda text or AI-extracted agenda
-- showAgendaUrl already exists for URL-based agenda

ALTER TABLE tradeshows 
ADD COLUMN IF NOT EXISTS agenda_content TEXT;

COMMENT ON COLUMN tradeshows.agenda_content IS 'Event agenda content - manually entered or AI-extracted from uploaded documents';

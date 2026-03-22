-- Migration: Make subjects global (not tied to a specific school)
-- Alter subjects table to make school_id nullable

ALTER TABLE subjects DROP CONSTRAINT subjects_school_id_fkey;
ALTER TABLE subjects ALTER COLUMN school_id DROP NOT NULL;

-- Verify
SELECT column_name, is_nullable FROM information_schema.columns 
WHERE table_name = 'subjects' AND column_name = 'school_id';

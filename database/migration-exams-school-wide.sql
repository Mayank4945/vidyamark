-- Add school_id column to exams table to support school-wide exams

ALTER TABLE exams ADD COLUMN IF NOT EXISTS school_id INTEGER;

-- Add foreign key constraint
ALTER TABLE exams 
ADD CONSTRAINT fk_exams_school_id 
FOREIGN KEY (school_id) REFERENCES schools(id) 
ON DELETE CASCADE;

-- Migrate data: populate school_id from class relationship
UPDATE exams e
SET school_id = c.school_id
FROM classes c
WHERE e.class_id = c.id AND e.school_id IS NULL;

-- Make class_id nullable for future school-wide exams
ALTER TABLE exams ALTER COLUMN class_id DROP NOT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exams_school_id ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_exam_date ON exams(exam_date);

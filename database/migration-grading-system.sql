-- ===========================
-- Grading System Migration
-- ===========================
-- This migration adds comprehensive grading and academic year management

-- ===========================
-- 1. ACADEMIC YEARS TABLE
-- ===========================
-- Stores academic year configuration per school
-- Example: '2025-26', '2026-27'
CREATE TABLE IF NOT EXISTS academic_years (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(20) NOT NULL, -- e.g., '2025-26', '2026-27'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_academic_years_school_id ON academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(school_id, is_active);

-- ===========================
-- 2. GRADING POLICIES TABLE
-- ===========================
-- Defines school-wide grading policy and weightages
-- Example: "Standard Policy" with Unit Test: 20%, Mid Term: 25%, Final: 25%, etc.
CREATE TABLE IF NOT EXISTS grading_policies (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g., 'Standard Grading Policy 2025-26'
  description TEXT,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_grading_policies_school_id ON grading_policies(school_id);
CREATE INDEX IF NOT EXISTS idx_grading_policies_academic_year ON grading_policies(academic_year_id);

-- ===========================
-- 3. EXAM TYPE WEIGHTAGES TABLE
-- ===========================
-- Defines how each exam type contributes to final grade
-- Example:
--   Unit Test 1: 20%, max 20 marks
--   Unit Test 2: 20%, max 20 marks
--   Project: 10%, max 10 marks
--   Mid Term: 25%, max 80 marks
--   Final Term: 25%, max 100 marks
CREATE TABLE IF NOT EXISTS exam_type_weightages (
  id SERIAL PRIMARY KEY,
  grading_policy_id INTEGER NOT NULL REFERENCES grading_policies(id) ON DELETE CASCADE,
  exam_type VARCHAR(50) NOT NULL, -- 'unit_test_1', 'unit_test_2', 'mid_term', 'final_term', 'project', etc.
  display_name VARCHAR(100), -- 'Unit Test 1', 'Unit Test 2', etc.
  weight_percentage DECIMAL(5, 2) NOT NULL, -- e.g., 20 for 20%
  sequence_order INTEGER DEFAULT 0, -- For ordering display
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(grading_policy_id, exam_type)
);

CREATE INDEX IF NOT EXISTS idx_exam_type_weightages_policy ON exam_type_weightages(grading_policy_id);

-- ===========================
-- 4. GRADE CONFIGURATION TABLE
-- ===========================
-- Defines grade scales (A, B, C, D, F) with percentage ranges
-- Example: A: 85-100, B: 75-84, C: 65-74, D: 55-64, F: 0-54
CREATE TABLE IF NOT EXISTS grade_scales (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  grade_letter VARCHAR(2) NOT NULL, -- 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'
  min_percentage DECIMAL(5, 2) NOT NULL,
  max_percentage DECIMAL(5, 2) NOT NULL,
  grade_point DECIMAL(3, 2), -- GPA: 4.0, 3.5, 3.0, etc.
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, grade_letter)
);

CREATE INDEX IF NOT EXISTS idx_grade_scales_school_id ON grade_scales(school_id);

-- ===========================
-- 5. CALCULATED GRADES TABLE
-- ===========================
-- Stores final calculated grades for each student per academic year
-- This table stores the computed final grade, avoiding repeated calculations
CREATE TABLE IF NOT EXISTS calculated_grades (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  weighted_percentage DECIMAL(5, 2), -- Final weighted percentage (0-100)
  grade_letter VARCHAR(2), -- 'A', 'B', 'C', 'D', 'F'
  grade_point DECIMAL(3, 2), -- GPA
  total_exams_taken INTEGER DEFAULT 0,
  total_exams_missed INTEGER DEFAULT 0,
  calculation_details JSONB, -- Stores detailed breakdown of the calculation
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  calculated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, class_id, academic_year_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_calculated_grades_student ON calculated_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_calculated_grades_class ON calculated_grades(class_id);
CREATE INDEX IF NOT EXISTS idx_calculated_grades_academic_year ON calculated_grades(academic_year_id);

-- ===========================
-- 6. UPDATE EXAMS TABLE
-- ===========================
-- Add academic_year_id and weight_percentage to exams
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE;

ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS weight_percentage DECIMAL(5, 2) DEFAULT 100;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_exams_academic_year_id ON exams(academic_year_id);

-- ===========================
-- 7. LOG TABLE FOR CALCULATIONS
-- ===========================
-- Audit trail for grade calculations
CREATE TABLE IF NOT EXISTS grade_calculation_logs (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_year_id INTEGER NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  students_processed INTEGER,
  calculation_status VARCHAR(50), -- 'in_progress', 'completed', 'failed'
  error_message TEXT,
  calculated_by INTEGER NOT NULL REFERENCES users(id),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grade_calc_logs_school ON grade_calculation_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_grade_calc_logs_academic_year ON grade_calculation_logs(academic_year_id);

-- ===========================
-- DONE
-- ===========================
-- Migration complete. All grading system tables created.
-- Next: Run seed data for default grade scales and grading policies

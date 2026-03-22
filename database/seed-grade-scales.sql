-- ===========================
-- Seed Data: Default Grade Scales
-- ===========================
-- Default grading scale applicable to all schools
-- Schools can modify this to match their own grading policy

-- Standard 5-point grade scale (A, B, C, D, F)
-- This is a template; each school creates their own via the API

INSERT INTO grade_scales (school_id, grade_letter, min_percentage, max_percentage, grade_point, description)
SELECT 
  schools.id,
  'A',
  85.00,
  100.00,
  4.0,
  'Excellent - Outstanding performance'
FROM schools
WHERE NOT EXISTS (SELECT 1 FROM grade_scales WHERE school_id = schools.id AND grade_letter = 'A')

UNION ALL

SELECT 
  schools.id,
  'B',
  75.00,
  84.99,
  3.0,
  'Good - Above average performance'
FROM schools
WHERE NOT EXISTS (SELECT 1 FROM grade_scales WHERE school_id = schools.id AND grade_letter = 'B')

UNION ALL

SELECT 
  schools.id,
  'C',
  65.00,
  74.99,
  2.0,
  'Average - Satisfactory performance'
FROM schools
WHERE NOT EXISTS (SELECT 1 FROM grade_scales WHERE school_id = schools.id AND grade_letter = 'C')

UNION ALL

SELECT 
  schools.id,
  'D',
  55.00,
  64.99,
  1.0,
  'Below Average - Needs improvement'
FROM schools
WHERE NOT EXISTS (SELECT 1 FROM grade_scales WHERE school_id = schools.id AND grade_letter = 'D')

UNION ALL

SELECT 
  schools.id,
  'F',
  0.00,
  54.99,
  0.0,
  'Fail - Does not meet standards'
FROM schools
WHERE NOT EXISTS (SELECT 1 FROM grade_scales WHERE school_id = schools.id AND grade_letter = 'F');

-- ===========================
-- DONE
-- ===========================
-- Default grade scales have been created for all schools

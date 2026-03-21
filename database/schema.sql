-- VidyaMark Database Schema
-- PostgreSQL DDL for Student Data and Exam Management

-- ===========================
-- USERS TABLE (Teachers/Admin)
-- ===========================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'teacher', -- 'admin', 'teacher', 'principal'
  school_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- SCHOOL TABLE
-- ===========================
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  principal VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- CLASSES/SECTIONS TABLE
-- ===========================
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- e.g., "10-A", "Class 12-B"
  grade_level INTEGER NOT NULL, -- 1-12
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, name)
);

-- ===========================
-- STUDENTS TABLE
-- ===========================
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  roll_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  parent_name VARCHAR(100),
  parent_contact VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, class_id, roll_number)
);

-- ===========================
-- SUBJECTS TABLE
-- ===========================
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- CLASS SUBJECT MAPPING
-- ===========================
CREATE TABLE class_subjects (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  max_marks DECIMAL(5, 2) DEFAULT 100,
  pass_marks DECIMAL(5, 2) DEFAULT 40,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, subject_id)
);

-- ===========================
-- EXAMS TABLE
-- ===========================
CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type VARCHAR(50) NOT NULL, -- 'unit_test', 'mid_term', 'final_term', 'assignment'
  exam_name VARCHAR(100) NOT NULL,
  exam_date DATE NOT NULL,
  max_marks DECIMAL(5, 2) NOT NULL DEFAULT 100,
  weightage DECIMAL(5, 2) DEFAULT 100, -- For weighted grade calculation
  passing_marks DECIMAL(5, 2),
  description TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- MARKS TABLE (Core marking)
-- ===========================
CREATE TABLE marks (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marks_obtained DECIMAL(5, 2) NOT NULL,
  remarks TEXT,
  is_absent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, student_id)
);

-- ===========================
-- GRADE CONFIGURATION TABLE
-- ===========================
CREATE TABLE grade_configurations (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  grade_name VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D', 'F'
  min_percentage DECIMAL(5, 2) NOT NULL,
  max_percentage DECIMAL(5, 2) NOT NULL,
  grade_point DECIMAL(3, 1),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- STUDENT CLASS PERFORMANCE
-- ===========================
CREATE TABLE class_performance (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  total_marks_obtained DECIMAL(5, 2),
  total_marks_possible DECIMAL(5, 2),
  percentage DECIMAL(5, 2),
  grade VARCHAR(5),
  remarks TEXT,
  semester VARCHAR(20), -- '1st Semester', '2nd Semester', 'Full Year'
  academic_year VARCHAR(20), -- '2024-2025'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, student_id, subject_id, semester, academic_year)
);

-- ===========================
-- REPORT CARDS
-- ===========================
CREATE TABLE report_cards (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  semester VARCHAR(20),
  academic_year VARCHAR(20),
  total_percentage DECIMAL(5, 2),
  rank_in_class INTEGER,
  principal_remarks TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, class_id, semester, academic_year)
);

-- ===========================
-- EXPORT LOG (For audit trail)
-- ===========================
CREATE TABLE export_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  export_type VARCHAR(50), -- 'excel', 'pdf', 'csv'
  class_id INTEGER REFERENCES classes(id),
  export_format VARCHAR(50),
  file_path VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- INDEXES (For performance)
-- ===========================
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_marks_exam_id ON marks(exam_id);
CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_exams_class_id ON exams(class_id);
CREATE INDEX idx_exams_subject_id ON exams(subject_id);
CREATE INDEX idx_class_subjects_class_id ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_subject_id ON class_subjects(subject_id);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_classes_school_id ON classes(school_id);

-- ===========================
-- AUDIT FUNCTION
-- ===========================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_schools_timestamp BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_classes_timestamp BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_students_timestamp BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_subjects_timestamp BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_exams_timestamp BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_marks_timestamp BEFORE UPDATE ON marks FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_class_performance_timestamp BEFORE UPDATE ON class_performance FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_report_cards_timestamp BEFORE UPDATE ON report_cards FOR EACH ROW EXECUTE FUNCTION update_timestamp();

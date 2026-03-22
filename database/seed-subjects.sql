-- Seed default subjects for VidyaMark
-- These are global subjects, not tied to any specific school

INSERT INTO subjects (code, name, description) VALUES
('HI', 'Hindi', 'Hindi Language'),
('EN', 'English', 'English Language'),
('MA', 'Mathematics', 'Mathematics'),
('SC', 'Science', 'Science'),
('SS', 'Social Science', 'Social Studies and History'),
('SA', 'Sanskrit', 'Sanskrit Language'),
('PE', 'Physical Education', 'Physical Education and Sports'),
('ART', 'Art', 'Visual Arts and Crafts'),
('CS', 'Computer Science', 'Information Technology and Computer Science');

-- Verify
SELECT id, code, name FROM subjects ORDER BY code;

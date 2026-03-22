-- Seed default subjects for VidyaMark

INSERT INTO subjects (code, name, description) VALUES
('HI', 'Hindi', 'Hindi Language'),
('EN', 'English', 'English Language'),
('MA', 'Mathematics', 'Mathematics'),
('SC', 'Science', 'Science'),
('SS', 'Social Science', 'Social Studies and History'),
('SA', 'Sanskrit', 'Sanskrit Language'),
('PE', 'Physical Education', 'Physical Education and Sports'),
('ART', 'Art', 'Visual Arts and Crafts'),
('CS', 'Computer Science', 'Information Technology and Computer Science')
ON CONFLICT (code) DO NOTHING;

import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  const decoded = verifyToken(token);
  if (!token || !decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userSchoolId = decoded.schoolId;

  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'GET') {
    try {
      const classId = req.query.classId ? parseInt(req.query.classId as string) : null;
      const examId = req.query.examId ? parseInt(req.query.examId as string) : null;
      const type = (req.query.type as string) || 'class-performance'; // class-performance, student-ranking, subject-wise, performance-trend

      // Verify class belongs to user's school
      if (classId) {
        const classCheck = await query('SELECT * FROM classes WHERE id = $1 AND school_id = $2', [classId, userSchoolId]);
        if (classCheck.rows.length === 0) {
          return res.status(403).json({ error: 'Forbidden: Class not found in your school' });
        }
      }

      if (type === 'class-performance') {
        // Get overall class performance statistics
        const sql = `
          SELECT 
            c.id,
            c.name as class_name,
            COUNT(DISTINCT m.student_id) as total_students,
            COUNT(DISTINCT m.exam_id) as exams_taken,
            ROUND(AVG(m.marks_obtained), 2) as average_marks,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY m.marks_obtained), 2) as median_marks,
            MIN(m.marks_obtained) as min_marks,
            MAX(m.marks_obtained) as max_marks,
            COUNT(CASE WHEN m.marks_obtained >= e.passing_marks THEN 1 END)::float / 
              NULLIF(COUNT(m.id), 0) * 100 as pass_percentage
          FROM classes c
          LEFT JOIN students s ON c.id = s.class_id
          LEFT JOIN marks m ON s.id = m.student_id
          LEFT JOIN exams e ON m.exam_id = e.id
          WHERE c.school_id = $1
          ${classId ? 'AND c.id = $' + 2 : ''}
          GROUP BY c.id, c.name
          ORDER BY c.name
        `;
        
        const params = [userSchoolId];
        if (classId) params.push(classId);
        
        const result = await query(sql, params);
        res.json({ success: true, data: result.rows });
      } else if (type === 'student-ranking') {
        // Get student ranking by average marks
        if (!classId) {
          return res.status(400).json({ error: 'classId is required for student-ranking' });
        }

        const sql = `
          SELECT 
            s.id,
            s.roll_number,
            s.first_name,
            s.last_name,
            ROUND(AVG(m.marks_obtained), 2) as average_marks,
            COUNT(DISTINCT m.exam_id) as exams_attempted,
            COUNT(CASE WHEN m.marks_obtained >= e.passing_marks THEN 1 END) as passed_exams,
            COUNT(CASE WHEN m.marks_obtained < e.passing_marks THEN 1 END) as failed_exams,
            ROW_NUMBER() OVER (ORDER BY AVG(m.marks_obtained) DESC) as rank
          FROM students s
          LEFT JOIN marks m ON s.id = m.student_id
          LEFT JOIN exams e ON m.exam_id = e.id
          WHERE s.class_id = $1 AND s.school_id = $2
          GROUP BY s.id, s.roll_number, s.first_name, s.last_name
          ORDER BY rank
        `;
        
        const result = await query(sql, [classId, userSchoolId]);
        res.json({ success: true, data: result.rows });
      } else if (type === 'subject-wise') {
        // Get subject-wise performance
        if (!classId) {
          return res.status(400).json({ error: 'classId is required for subject-wise' });
        }

        const sql = `
          SELECT 
            subj.id,
            subj.name as subject_name,
            ROUND(AVG(m.marks_obtained), 2) as average_marks,
            ROUND(MAX(m.marks_obtained), 2) as highest_marks,
            ROUND(MIN(m.marks_obtained), 2) as lowest_marks,
            COUNT(DISTINCT m.exam_id) as total_exams,
            COUNT(DISTINCT s.id) as students_attempted,
            COUNT(CASE WHEN m.marks_obtained >= e.passing_marks THEN 1 END)::float / 
              NULLIF(COUNT(m.id), 0) * 100 as pass_percentage
          FROM subjects subj
          LEFT JOIN exams e ON subj.id = e.subject_id
          LEFT JOIN classes c ON (c.school_id = e.school_id OR c.id = e.class_id)
          LEFT JOIN students s ON c.id = s.class_id
          LEFT JOIN marks m ON s.id = m.student_id AND m.exam_id = e.id
          WHERE c.school_id = $1 AND c.id = $2
          GROUP BY subj.id, subj.name
          HAVING COUNT(m.id) > 0
          ORDER BY average_marks DESC
        `;
        
        const result = await query(sql, [userSchoolId, classId]);
        res.json({ success: true, data: result.rows });
      } else if (type === 'performance-trend') {
        // Get performance trends over exams
        if (!classId) {
          return res.status(400).json({ error: 'classId is required for performance-trend' });
        }

        const sql = `
          SELECT 
            e.id as exam_id,
            e.exam_name,
            e.exam_date,
            subj.name as subject_name,
            ROUND(AVG(m.marks_obtained), 2) as average_marks,
            e.max_marks,
            e.passing_marks,
            COUNT(DISTINCT m.student_id) as students_attempted,
            COUNT(CASE WHEN m.marks_obtained >= e.passing_marks THEN 1 END) as students_passed
          FROM exams e
          LEFT JOIN subjects subj ON e.subject_id = subj.id
          LEFT JOIN classes c ON (c.school_id = e.school_id OR c.id = e.class_id)
          LEFT JOIN students s ON c.id = s.class_id
          LEFT JOIN marks m ON s.id = m.student_id AND m.exam_id = e.id
          WHERE c.school_id = $1 AND c.id = $2
          GROUP BY e.id, e.exam_name, e.exam_date, subj.name, e.max_marks, e.passing_marks
          ORDER BY e.exam_date
        `;
        
        const result = await query(sql, [userSchoolId, classId]);
        res.json({ success: true, data: result.rows });
      } else {
        res.status(400).json({ error: 'Invalid type parameter' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

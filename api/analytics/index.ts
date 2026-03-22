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
      const type = (req.query.type as string) || 'class-performance';

      if (!classId) {
        return res.status(400).json({ error: 'classId is required' });
      }

      // Verify class belongs to user's school
      const classCheck = await query('SELECT * FROM classes WHERE id = $1 AND school_id = $2', [classId, userSchoolId]);
      if (classCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Class not found in your school' });
      }

      if (type === 'class-performance') {
        // Subject-wise average marks for the class
        const sql = `
          SELECT 
            subj.name as subject,
            ROUND(AVG(m.marks_obtained)::NUMERIC, 2) as average,
            COUNT(DISTINCT m.student_id) as student_count,
            COUNT(DISTINCT m.exam_id) as exam_count
          FROM subjects subj
          LEFT JOIN exams e ON subj.id = e.subject_id
          LEFT JOIN marks m ON e.id = m.exam_id
          LEFT JOIN students s ON m.student_id = s.id
          WHERE (e.school_id = $1 OR e.class_id = $1) 
            AND s.class_id = $1
            AND m.id IS NOT NULL
          GROUP BY subj.id, subj.name
          ORDER BY average DESC NULLS LAST
        `;
        
        const result = await query(sql, [classId]);
        res.json({ success: true, data: result.rows });
      } else if (type === 'student-ranking') {
        // Student ranking by average marks
        const sql = `
          SELECT 
            s.id,
            (s.first_name || ' ' || s.last_name) as name,
            s.roll_number,
            ROUND(AVG(m.marks_obtained)::NUMERIC, 2) as score,
            COUNT(DISTINCT m.exam_id) as exams_taken,
            ROW_NUMBER() OVER (ORDER BY AVG(m.marks_obtained) DESC) as rank
          FROM students s
          LEFT JOIN marks m ON s.id = m.student_id
          LEFT JOIN exams e ON m.exam_id = e.id
          WHERE s.class_id = $1 
            AND s.school_id = $2
            AND m.id IS NOT NULL
          GROUP BY s.id, s.first_name, s.last_name, s.roll_number
          ORDER BY rank
        `;
        
        const result = await query(sql, [classId, userSchoolId]);
        res.json({ success: true, data: result.rows });
      } else if (type === 'subject-wise') {
        // Percentage distribution across subjects
        const sql = `
          SELECT 
            subj.name as subject,
            ROUND((COUNT(m.id)::NUMERIC / NULLIF(SUM(COUNT(m.id)) OVER (), 0) * 100), 2) as percentage
          FROM subjects subj
          LEFT JOIN exams e ON subj.id = e.subject_id
          LEFT JOIN marks m ON e.id = m.exam_id
          LEFT JOIN students s ON m.student_id = s.id
          WHERE (e.school_id = $1 OR e.class_id = $1)
            AND s.class_id = $1
            AND m.id IS NOT NULL
          GROUP BY subj.id, subj.name
          HAVING COUNT(m.id) > 0
          ORDER BY percentage DESC
        `;
        
        const result = await query(sql, [classId]);
        res.json({ success: true, data: result.rows });
      } else if (type === 'performance-trend') {
        // Performance trend over exam dates
        const sql = `
          SELECT 
            e.exam_name as month,
            e.exam_date,
            ROUND(AVG(m.marks_obtained)::NUMERIC, 2) as average,
            COUNT(DISTINCT m.student_id) as students_attempted,
            COUNT(CASE WHEN m.marks_obtained >= e.passing_marks THEN 1 END) as students_passed
          FROM exams e
          LEFT JOIN marks m ON e.id = m.exam_id
          LEFT JOIN students s ON m.student_id = s.id
          WHERE (e.school_id = $1 OR e.class_id = $1)
            AND s.class_id = $1
            AND m.id IS NOT NULL
          GROUP BY e.id, e.exam_name, e.exam_date, e.passing_marks
          ORDER BY e.exam_date ASC
        `;
        
        const result = await query(sql, [classId]);
        res.json({ success: true, data: result.rows });
      } else {
        res.status(400).json({ error: 'Invalid type parameter' });
      }
    } catch (error: any) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

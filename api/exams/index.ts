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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  if (req.method === 'GET') {
    try {
      // Get all school-wide exams (not tied to classes)
      const sql = `
        SELECT DISTINCT 
          e.id, e.subject_id, e.exam_type, e.exam_name, 
          e.exam_date, e.max_marks, e.passing_marks, 
          e.description, e.created_by, e.created_at, e.updated_at
        FROM exams e
        LEFT JOIN classes c ON e.class_id = c.id
        WHERE (c.school_id = $1 OR e.school_id = $1)
        GROUP BY e.id, e.subject_id, e.exam_type, e.exam_name, 
                 e.exam_date, e.max_marks, e.passing_marks, 
                 e.description, e.created_by, e.created_at, e.updated_at
        ORDER BY e.exam_date DESC
      `;
      
      const result = await query(sql, [userSchoolId]);
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { subjectId, examType, examName, examDate, maxMarks, passingMarks, description, school_id } = req.body;
      
      if (!subjectId || !examType || !examName || !examDate) {
        return res.status(400).json({ error: 'subjectId, examType, examName, and examDate are required' });
      }

      const result = await query(
        `INSERT INTO exams (school_id, subject_id, exam_type, exam_name, exam_date, max_marks, passing_marks, description, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [userSchoolId, subjectId, examType, examName, examDate, maxMarks || 100, passingMarks || 40, description || null, decoded.userId]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, examName, examDate, maxMarks, passingMarks, description } = req.body;

      // Verify exam belongs to user's school
      const examCheck = await query(
        `SELECT e.* FROM exams e 
         LEFT JOIN classes c ON e.class_id = c.id
         WHERE e.id = $1 AND (c.school_id = $2 OR e.school_id = $2)`,
        [id, userSchoolId]
      );
      if (examCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Exam not found in your school' });
      }

      const result = await query(
        `UPDATE exams SET exam_name=$1, exam_date=$2, max_marks=$3, passing_marks=$4, description=$5, updated_at=CURRENT_TIMESTAMP
         WHERE id=$6 RETURNING *`,
        [examName, examDate, maxMarks || 100, passingMarks || 40, description || null, id]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      // Verify exam belongs to user's school
      const examCheck = await query(
        `SELECT e.* FROM exams e 
         LEFT JOIN classes c ON e.class_id = c.id
         WHERE e.id = $1 AND (c.school_id = $2 OR e.school_id = $2)`,
        [id, userSchoolId]
      );
      if (examCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Exam not found in your school' });
      }

      await query('DELETE FROM exams WHERE id = $1', [id]);
      res.json({ success: true, message: 'Exam deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

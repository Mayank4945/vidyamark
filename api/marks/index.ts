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
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : null;
      const examId = req.query.examId ? parseInt(req.query.examId as string) : null;
      let sql = 'SELECT m.* FROM marks m INNER JOIN exams e ON m.exam_id = e.id INNER JOIN classes c ON e.class_id = c.id WHERE c.school_id = $1';
      const params: any[] = [userSchoolId];

      if (studentId) {
        sql += ' AND m.student_id = $' + (params.length + 1);
        params.push(studentId);
      }
      if (examId) {
        sql += ' AND m.exam_id = $' + (params.length + 1);
        params.push(examId);
      }
      sql += ' ORDER BY m.created_at DESC';

      const result = await query(sql, params);
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
      const { studentId, examId, marksObtained, isAbsent } = req.body;

      // Verify exam belongs to user's school
      const examCheck = await query('SELECT e.* FROM exams e INNER JOIN classes c ON e.class_id = c.id WHERE e.id = $1 AND c.school_id = $2', [examId, userSchoolId]);
      if (examCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Exam not found in your school' });
      }

      // Verify student belongs to user's school
      const studentCheck = await query('SELECT * FROM students WHERE id = $1 AND school_id = $2', [studentId, userSchoolId]);
      if (studentCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Student not found in your school' });
      }

      const result = await query(
        'INSERT INTO marks (student_id, exam_id, marks_obtained, is_absent) VALUES ($1, $2, $3, $4) RETURNING *',
        [studentId, examId, marksObtained || null, isAbsent || false]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, marksObtained, isAbsent } = req.body;

      // Verify mark belongs to user's school
      const markCheck = await query('SELECT m.* FROM marks m INNER JOIN exams e ON m.exam_id = e.id INNER JOIN classes c ON e.class_id = c.id WHERE m.id = $1 AND c.school_id = $2', [id, userSchoolId]);
      if (markCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Mark not found in your school' });
      }

      const result = await query(
        'UPDATE marks SET marks_obtained=$1, is_absent=$2 WHERE id=$3 RETURNING *',
        [marksObtained || null, isAbsent || false, id]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      // Verify mark belongs to user's school
      const markCheck = await query('SELECT m.* FROM marks m INNER JOIN exams e ON m.exam_id = e.id INNER JOIN classes c ON e.class_id = c.id WHERE m.id = $1 AND c.school_id = $2', [id, userSchoolId]);
      if (markCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Mark not found in your school' });
      }

      await query('DELETE FROM marks WHERE id = $1', [id]);
      res.json({ success: true, message: 'Mark deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

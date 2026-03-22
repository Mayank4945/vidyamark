import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  if (req.method === 'GET') {
    try {
      const classId = req.query.classId ? parseInt(req.query.classId as string) : null;
      const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : null;
      let sql = 'SELECT * FROM exams WHERE 1=1';
      const params: any[] = [];

      if (schoolId) {
        sql += ' AND school_id = $' + (params.length + 1);
        params.push(schoolId);
      }
      if (classId) {
        sql += ' AND class_id = $' + (params.length + 1);
        params.push(classId);
      }
      sql += ' ORDER BY name';

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
      const token = extractToken(req.headers.authorization);
      if (!token || !verifyToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { classId, subjectId, examType, examName, examDate, maxMarks, passingMarks, description } = req.body;
      
      if (!classId || !subjectId || !examType || !examName || !examDate) {
        return res.status(400).json({ error: 'classId, subjectId, examType, examName, and examDate are required' });
      }

      const result = await query(
        'INSERT INTO exams (class_id, subject_id, exam_type, exam_name, exam_date, max_marks, passing_marks, description, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [classId, subjectId, examType, examName, examDate, maxMarks || 100, passingMarks || 40, description || null, 1]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token || !verifyToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id, examName, examDate, maxMarks, passingMarks, description } = req.body;
      const result = await query(
        'UPDATE exams SET exam_name=$1, exam_date=$2, max_marks=$3, passing_marks=$4, description=$5 WHERE id=$6 RETURNING *',
        [examName, examDate, maxMarks || 100, passingMarks || 40, description || null, id]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      await query('DELETE FROM exams WHERE id = $1', [id]);
      res.json({ success: true, message: 'Exam deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

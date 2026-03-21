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
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : null;
      const examId = req.query.examId ? parseInt(req.query.examId as string) : null;
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : null;
      let sql = 'SELECT * FROM marks WHERE 1=1';
      const params: any[] = [];

      if (studentId) {
        sql += ' AND student_id = $' + (params.length + 1);
        params.push(studentId);
      }
      if (examId) {
        sql += ' AND exam_id = $' + (params.length + 1);
        params.push(examId);
      }
      if (subjectId) {
        sql += ' AND subject_id = $' + (params.length + 1);
        params.push(subjectId);
      }
      sql += ' ORDER BY created_at DESC';

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
      const { studentId, examId, subjectId, marksObtained } = req.body;
      const result = await query(
        'INSERT INTO marks (student_id, exam_id, subject_id, marks_obtained) VALUES ($1, $2, $3, $4) RETURNING *',
        [studentId, examId, subjectId, marksObtained]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, marksObtained } = req.body;
      const result = await query(
        'UPDATE marks SET marks_obtained=$1 WHERE id=$2 RETURNING *',
        [marksObtained, id]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      await query('DELETE FROM marks WHERE id = $1', [id]);
      res.json({ success: true, message: 'Mark deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

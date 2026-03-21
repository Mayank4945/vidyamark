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
      const { classId, schoolId } = req.query;
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
      const { schoolId, classId, name, date, totalMarks, description } = req.body;
      const result = await query(
        'INSERT INTO exams (school_id, class_id, name, date, total_marks, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [schoolId, classId, name, date || null, totalMarks || 100, description || null]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, date, totalMarks, description } = req.body;
      const result = await query(
        'UPDATE exams SET name=$1, date=$2, total_marks=$3, description=$4 WHERE id=$5 RETURNING *',
        [name, date || null, totalMarks || 100, description || null, id]
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

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
      let sql = 'SELECT * FROM students WHERE 1=1';
      const params: any[] = [];

      if (schoolId) {
        sql += ' AND school_id = $' + (params.length + 1);
        params.push(schoolId);
      }
      if (classId) {
        sql += ' AND class_id = $' + (params.length + 1);
        params.push(classId);
      }
      sql += ' ORDER BY roll_number';

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
      const { schoolId, classId, rollNumber, firstName, lastName, dateOfBirth, phone, email } = req.body;
      
      const result = await query(
        'INSERT INTO students (school_id, class_id, roll_number, first_name, last_name, date_of_birth, phone, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [schoolId, classId, rollNumber, firstName, lastName, dateOfBirth || null, phone || null, email || null]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, firstName, lastName, dateOfBirth, phone, email } = req.body;
      const result = await query(
        'UPDATE students SET first_name=$1, last_name=$2, date_of_birth=$3, phone=$4, email=$5 WHERE id=$6 RETURNING *',
        [firstName, lastName, dateOfBirth || null, phone || null, email || null, id]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      await query('DELETE FROM students WHERE id = $1', [id]);
      res.json({ success: true, message: 'Student deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

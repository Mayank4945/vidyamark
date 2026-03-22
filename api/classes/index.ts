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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');

  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT * FROM classes WHERE school_id = $1 ORDER BY name',
        [userSchoolId]
      );
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
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }
      const result = await query(
        'INSERT INTO classes (school_id, name) VALUES ($1, $2) RETURNING *',
        [userSchoolId, name]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Verify class belongs to user's school
      const classCheck = await query('SELECT * FROM classes WHERE id = $1 AND school_id = $2', [id, userSchoolId]);
      if (classCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Class not found in your school' });
      }

      await query('DELETE FROM classes WHERE id = $1', [id]);
      res.json({ success: true, message: 'Class deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

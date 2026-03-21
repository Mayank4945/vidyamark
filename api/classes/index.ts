import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');

  if (req.method === 'GET') {
    try {
      const schoolId = req.query.schoolId;
      if (!schoolId) {
        return res.status(400).json({ error: 'schoolId is required' });
      }
      const result = await query(
        'SELECT * FROM classes WHERE school_id = $1 ORDER BY name',
        [schoolId]
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
      const { schoolId, name } = req.body;
      if (!schoolId || !name) {
        return res.status(400).json({ error: 'schoolId and name are required' });
      }
      const result = await query(
        'INSERT INTO classes (school_id, name) VALUES ($1, $2) RETURNING *',
        [schoolId, name]
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
      await query('DELETE FROM classes WHERE id = $1', [id]);
      res.json({ success: true, message: 'Class deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

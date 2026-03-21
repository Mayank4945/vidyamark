import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');

  if (req.method === 'GET') {
    try {
      const result = await query('SELECT * FROM subjects ORDER BY code');
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

      const { code, name, maxMarks } = req.body;
      if (!code || !name) {
        return res.status(400).json({ error: 'code and name are required' });
      }

      const result = await query(
        'INSERT INTO subjects (code, name, max_marks) VALUES ($1, $2, $3) RETURNING *',
        [code, name, maxMarks || 100]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const token = extractToken(req.headers.authorization);
      if (!token || !verifyToken(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.body;
      await query('DELETE FROM subjects WHERE id = $1', [id]);
      res.json({ success: true, message: 'Subject deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  const decoded = verifyToken(token);

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  // Allow public access for GET (reading schools for registration form)
  if (req.method === 'GET') {
    try {
      const result = await query('SELECT id, name, principal, phone, address FROM schools ORDER BY name');
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // Require authentication for POST, PUT, DELETE
  if (!token || !decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only main admin can manage schools
  if (decoded.role !== 'main_admin') {
    return res.status(403).json({ error: 'Forbidden: Only main admin can manage schools' });
  }

  if (req.method === 'POST') {
    try {
      const { name, address, phone, principal } = req.body;
      const result = await query(
        'INSERT INTO schools (name, address, phone, principal) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, address || null, phone || null, principal || null]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, address, phone, principal } = req.body;
      const result = await query(
        'UPDATE schools SET name=$1, address=$2, phone=$3, principal=$4 WHERE id=$5 RETURNING *',
        [name, address || null, phone || null, principal || null, id]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      await query('DELETE FROM schools WHERE id = $1', [id]);
      res.json({ success: true, message: 'School deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

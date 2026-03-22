import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  const decoded = verifyToken(token);
  if (!token || !decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only main admin can manage schools
  if (decoded.role !== 'main_admin') {
    return res.status(403).json({ error: 'Forbidden: Only main admin can manage schools' });
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  if (req.method === 'GET') {
    try {
      const result = await query('SELECT * FROM schools ORDER BY name');
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
      const { name, address, phone, principal, city, email } = req.body;
      const result = await query(
        'INSERT INTO schools (name, address, phone, principal, city, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name || null, address || null, phone || null, principal || null, city || null, email || null]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, address, phone, principal, city, email } = req.body;
      const result = await query(
        'UPDATE schools SET name=$1, address=$2, phone=$3, principal=$4, city=$5, email=$6 WHERE id=$7 RETURNING *',
        [name || null, address || null, phone || null, principal || null, city || null, email || null, id]
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

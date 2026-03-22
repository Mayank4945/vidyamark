import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const result = await query(
        'SELECT id, name, principal, phone, address, created_at FROM schools WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'School not found' });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
    return;
  }

  // Require authentication for PUT, DELETE
  const token = extractToken(req.headers.authorization);
  const decoded = verifyToken(token);

  if (!token || !decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only main admin can manage schools
  if (decoded.role !== 'main_admin') {
    return res.status(403).json({ error: 'Forbidden: Only main admin can manage schools' });
  }

  if (req.method === 'PUT') {
    try {
      const { name, address, phone, principal } = req.body;
      const result = await query(
        'UPDATE schools SET name = $1, address = $2, phone = $3, principal = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
        [name, address || null, phone || null, principal || null, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'School not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const result = await query('DELETE FROM schools WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'School not found' });
      }

      res.json({ success: true, message: 'School deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};

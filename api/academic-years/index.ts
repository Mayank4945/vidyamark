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
  const userRole = decoded.role;

  // Only school admins or principals can manage academic years
  if (userRole !== 'admin' && userRole !== 'principal') {
    return res.status(403).json({ error: 'Forbidden: Only admins can manage academic years' });
  }

  if (req.method === 'GET') {
    try {
      const includeInactive = req.query.includeInactive === 'true';

      let sql = `
        SELECT id, name, start_date, end_date, is_active, created_at, updated_at
        FROM academic_years
        WHERE school_id = $1
      `;

      if (!includeInactive) {
        sql += ` AND is_active = true`;
      }

      sql += ` ORDER BY start_date DESC`;

      const result = await query(sql, [userSchoolId]);
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching academic years:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, start_date, end_date, is_active } = req.body;

      if (!name || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields: name, start_date, end_date' });
      }

      // Validate date format
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }

      if (startDate >= endDate) {
        return res.status(400).json({ error: 'start_date must be before end_date' });
      }

      // Check if academic year already exists
      const existCheck = await query(
        'SELECT * FROM academic_years WHERE school_id = $1 AND name = $2',
        [userSchoolId, name]
      );

      if (existCheck.rows.length > 0) {
        return res.status(400).json({ error: `Academic year '${name}' already exists for your school` });
      }

      // If is_active is true, deactivate all others
      if (is_active) {
        await query(
          'UPDATE academic_years SET is_active = false WHERE school_id = $1',
          [userSchoolId]
        );
      }

      const result = await query(
        `INSERT INTO academic_years (school_id, name, start_date, end_date, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userSchoolId, name, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], is_active || false, decoded.userId]
      );

      res.status(201).json({
        success: true,
        message: 'Academic year created successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error creating academic year:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, is_active } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Verify academic year belongs to school
      const ayCheck = await query(
        'SELECT * FROM academic_years WHERE id = $1 AND school_id = $2',
        [id, userSchoolId]
      );

      if (ayCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Academic year not found' });
      }

      // If setting as active, deactivate all others
      if (is_active) {
        await query(
          'UPDATE academic_years SET is_active = false WHERE school_id = $1 AND id != $2',
          [userSchoolId, id]
        );
      }

      const result = await query(
        'UPDATE academic_years SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [is_active || false, id]
      );

      res.json({
        success: true,
        message: 'Academic year updated successfully',
        data: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error updating academic year:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Verify academic year belongs to school
      const ayCheck = await query(
        'SELECT * FROM academic_years WHERE id = $1 AND school_id = $2',
        [id, userSchoolId]
      );

      if (ayCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Academic year not found' });
      }

      // Check if any exams exist for this academic year
      const examsCheck = await query(
        'SELECT COUNT(*) as count FROM exams WHERE academic_year_id = $1',
        [id]
      );

      if (examsCheck.rows[0].count > 0) {
        return res.status(400).json({ error: 'Cannot delete academic year with existing exams' });
      }

      // Delete academic year
      await query('DELETE FROM academic_years WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Academic year deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting academic year:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

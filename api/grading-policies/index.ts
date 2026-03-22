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

  // Only school admins or principals can manage grading policies
  if (userRole !== 'admin' && userRole !== 'principal') {
    return res.status(403).json({ error: 'Forbidden: Only admins can manage grading policies' });
  }

  if (req.method === 'GET') {
    try {
      const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId as string) : null;

      // Get grading policies for the school
      let sql = `
        SELECT 
          gp.id,
          gp.name,
          gp.description,
          gp.academic_year_id,
          ay.name as academic_year,
          gp.is_active,
          gp.created_at,
          gp.updated_at,
          json_agg(
            json_build_object(
              'id', etw.id,
              'exam_type', etw.exam_type,
              'display_name', etw.display_name,
              'weight_percentage', etw.weight_percentage,
              'sequence_order', etw.sequence_order
            ) ORDER BY etw.sequence_order
          ) as weightages
        FROM grading_policies gp
        LEFT JOIN academic_years ay ON gp.academic_year_id = ay.id
        LEFT JOIN exam_type_weightages etw ON gp.id = etw.grading_policy_id
        WHERE gp.school_id = $1
      `;

      const params = [userSchoolId];

      if (academicYearId) {
        sql += ` AND gp.academic_year_id = $2`;
        params.push(academicYearId);
      }

      sql += ` GROUP BY gp.id, gp.name, gp.description, gp.academic_year_id, ay.name, gp.is_active, gp.created_at, gp.updated_at
               ORDER BY ay.created_at DESC, gp.created_at DESC`;

      const result = await query(sql, params);
      res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching grading policies:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, description, academic_year_id, weightages } = req.body;

      if (!name || !academic_year_id || !weightages || weightages.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: name, academic_year_id, weightages' });
      }

      // Verify academic year belongs to school
      const ayCheck = await query(
        'SELECT * FROM academic_years WHERE id = $1 AND school_id = $2',
        [academic_year_id, userSchoolId]
      );
      if (ayCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Academic year not found for your school' });
      }

      // Verify weightages sum to 100
      const totalWeight = weightages.reduce((sum: number, w: any) => sum + parseFloat(w.weight_percentage), 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return res.status(400).json({ error: `Weightages must sum to 100%, got ${totalWeight}%` });
      }

      // Create grading policy
      const gpResult = await query(
        `INSERT INTO grading_policies (school_id, name, description, academic_year_id, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userSchoolId, name, description || null, academic_year_id, decoded.userId]
      );

      const gradingPolicyId = gpResult.rows[0].id;

      // Insert weightages
      for (const w of weightages) {
        await query(
          `INSERT INTO exam_type_weightages (grading_policy_id, exam_type, display_name, weight_percentage, sequence_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [gradingPolicyId, w.exam_type, w.display_name || w.exam_type, w.weight_percentage, w.sequence_order || 0]
        );
      }

      res.status(201).json({ 
        success: true, 
        message: 'Grading policy created successfully',
        data: { id: gradingPolicyId, ...gpResult.rows[0] }
      });
    } catch (error: any) {
      console.error('Error creating grading policy:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, name, description, weightages, is_active } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Verify grading policy belongs to school
      const gpCheck = await query(
        'SELECT * FROM grading_policies WHERE id = $1 AND school_id = $2',
        [id, userSchoolId]
      );
      if (gpCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Grading policy not found' });
      }

      // Update grading policy
      await query(
        `UPDATE grading_policies SET name = $1, description = $2, is_active = $3, updated_at = NOW()
         WHERE id = $4`,
        [name || gpCheck.rows[0].name, description, is_active !== undefined ? is_active : gpCheck.rows[0].is_active, id]
      );

      // If weightages provided, update them
      if (weightages && weightages.length > 0) {
        const totalWeight = weightages.reduce((sum: number, w: any) => sum + parseFloat(w.weight_percentage), 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
          return res.status(400).json({ error: `Weightages must sum to 100%, got ${totalWeight}%` });
        }

        // Delete old weightages
        await query('DELETE FROM exam_type_weightages WHERE grading_policy_id = $1', [id]);

        // Insert new weightages
        for (const w of weightages) {
          await query(
            `INSERT INTO exam_type_weightages (grading_policy_id, exam_type, display_name, weight_percentage, sequence_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, w.exam_type, w.display_name || w.exam_type, w.weight_percentage, w.sequence_order || 0]
          );
        }
      }

      res.json({ success: true, message: 'Grading policy updated successfully' });
    } catch (error: any) {
      console.error('Error updating grading policy:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Verify grading policy belongs to school
      const gpCheck = await query(
        'SELECT * FROM grading_policies WHERE id = $1 AND school_id = $2',
        [id, userSchoolId]
      );
      if (gpCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Grading policy not found' });
      }

      // Delete grading policy (cascade deletes weightages)
      await query('DELETE FROM grading_policies WHERE id = $1', [id]);

      res.json({ success: true, message: 'Grading policy deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting grading policy:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

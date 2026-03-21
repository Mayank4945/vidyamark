import { Router } from 'express';
import { query } from '../database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Get all schools
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, address, phone, principal
       FROM schools
       ORDER BY name`
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch schools'
    });
  }
});

/**
 * Get school by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, name, address, phone, principal, created_at, updated_at
       FROM schools
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'School not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch school'
    });
  }
});

/**
 * Create a new school
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, address, phone, principal } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'School name is required'
      });
    }

    const result = await query(
      `INSERT INTO schools (name, address, phone, principal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, address || null, phone || null, principal || null]
    );

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating school:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create school'
    });
  }
});

/**
 * Update a school
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, principal } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (principal !== undefined) {
      updates.push(`principal = $${paramCount++}`);
      values.push(principal);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }

    values.push(id);
    const result = await query(
      `UPDATE schools SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'School not found'
      });
    }

    res.json({
      success: true,
      message: 'School updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update school'
    });
  }
});

/**
 * Delete a school
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM schools WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'School not found'
      });
    }

    res.json({
      success: true,
      message: 'School deleted successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error deleting school:', error);

    // Handle foreign key constraint violation
    if (error.code === '23503') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete school with existing classes, students, or related data'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete school'
    });
  }
});

export default router;

import { Router } from 'express';
import { query } from '../database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Get all classes for a school
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'schoolId query parameter is required'
      });
    }

    const result = await query(
      `SELECT id, name, grade_level, teacher_id
       FROM classes
       WHERE school_id = $1
       ORDER BY grade_level, name`,
      [schoolId]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch classes'
    });
  }
});

/**
 * Get class by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT c.*, u.first_name, u.last_name, s.name as school_name
       FROM classes c
       LEFT JOIN users u ON c.teacher_id = u.id
       LEFT JOIN schools s ON c.school_id = s.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch class'
    });
  }
});

/**
 * Create a new class
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { schoolId, name, gradeLevel, teacherId } = req.body;

    if (!schoolId || !name || !gradeLevel) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'schoolId, name, and gradeLevel are required'
      });
    }

    const result = await query(
      `INSERT INTO classes (school_id, name, grade_level, teacher_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [schoolId, name, gradeLevel, teacherId || null]
    );

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating class:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A class with this name already exists in this school'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create class'
    });
  }
});

/**
 * Update a class
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gradeLevel, teacherId } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (gradeLevel !== undefined) {
      updates.push(`grade_level = $${paramCount++}`);
      values.push(gradeLevel);
    }
    if (teacherId !== undefined) {
      updates.push(`teacher_id = $${paramCount++}`);
      values.push(teacherId);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }

    values.push(id);
    const result = await query(
      `UPDATE classes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update class'
    });
  }
});

/**
 * Delete a class
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `DELETE FROM classes WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Class deleted successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error deleting class:', error);

    // Handle foreign key constraint violation
    if (error.code === '23503') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Cannot delete class with existing students or related data'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete class'
    });
  }
});

export default router;

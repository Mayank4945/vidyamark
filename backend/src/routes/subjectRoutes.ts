import { Router, Request, Response } from 'express';
import { query } from '../database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Get all subjects
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, code, description
       FROM subjects
       ORDER BY name`
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to fetch subjects'
    });
  }
});

/**
 * Create a new subject
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name is required'
      });
    }

    const result = await query(
      `INSERT INTO subjects (name, code, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, code || null, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating subject:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A subject with this code already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create subject'
    });
  }
});

/**
 * Update a subject
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (code !== undefined) {
      updates.push(`code = $${paramCount++}`);
      values.push(code);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update'
      });
    }

    values.push(id);
    const result = await query(
      `UPDATE subjects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to update subject'
    });
  }
});

/**
 * Seed default subjects (global, shared across all schools)
 */
router.post('/seed', authMiddleware, async (req: Request, res: Response) => {
  try {
    const defaultSubjects = [
      { name: 'Hindi', code: 'HINDI' },
      { name: 'English', code: 'ENGLISH' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Science', code: 'SCIENCE' },
      { name: 'Social Science', code: 'SOSCIENCE' },
      { name: 'Sanskrit', code: 'SANSKRIT' },
      { name: 'Urdu', code: 'URDU' },
      { name: 'Home Science', code: 'HOMESCIENCE' },
      { name: 'Computer Application', code: 'COMPAPP' }
    ];

    const createdSubjects: any[] = [];

    for (const subject of defaultSubjects) {
      try {
        const result = await query(
          `INSERT INTO subjects (name, code)
           VALUES ($1, $2)
           ON CONFLICT (code) DO NOTHING
           RETURNING *`,
          [subject.name, subject.code]
        );
        
        if (result.rows.length > 0) {
          createdSubjects.push(result.rows[0]);
        }
      } catch (error: any) {
        // Skip if already exists
        console.log(`Subject ${subject.name} already exists`);
      }
    }

    res.json({
      success: true,
      message: 'Default subjects seeded successfully',
      data: createdSubjects,
      count: createdSubjects.length
    });
  } catch (error) {
    console.error('Error seeding subjects:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to seed subjects'
    });
  }
})

export default router;

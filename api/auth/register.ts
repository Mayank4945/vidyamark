import { VercelRequest, VercelResponse } from '@vercel/node';
import bcryptjs from 'bcryptjs';
import { query } from '../_lib/db';
import { generateToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email, password, firstName, and lastName are required'
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert user with school_id
    const { schoolId, role } = req.body;
    const userRole = role || 'teacher'; // Default role
    
    const result = await query(
      `INSERT INTO users (email, password, first_name, last_name, role, school_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role, school_id`,
      [email, hashedPassword, firstName, lastName, userRole, schoolId || null]
    );

    const user = result.rows[0];
    const token = generateToken({ userId: user.id, email: user.email, schoolId: user.school_id });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        schoolId: user.school_id
      },
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already registered'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

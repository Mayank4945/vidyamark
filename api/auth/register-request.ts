import { VercelRequest, VercelResponse } from '@vercel/node';
import bcryptjs from 'bcryptjs';
import { query } from '../_lib/db';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password, firstName, lastName, schoolId, subjectId, role } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !schoolId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email, password, firstName, lastName, and schoolId are required'
      });
    }

    // Default role to 'teacher' if not specified
    const userRole = role || 'teacher';

    // Teachers must have a subject
    if (userRole === 'teacher' && !subjectId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'subjectId is required for teachers'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid email format'
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Check if email already exists in users or user_requests
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    const existingRequest = await query('SELECT id FROM user_requests WHERE email = $1', [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email already registered'
      });
    }

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Registration request already exists for this email'
      });
    }

    // Create registration request (pending approval)
    const result = await query(
      `INSERT INTO user_requests (email, password_hash, first_name, last_name, school_id, subject_id, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, email, first_name, last_name, school_id, subject_id, role, status, requested_at`,
      [email, hashedPassword, firstName, lastName, schoolId, subjectId || null, userRole]
    );

    const userRequest = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully. Please wait for approval.',
      data: {
        id: userRequest.id,
        email: userRequest.email,
        firstName: userRequest.first_name,
        lastName: userRequest.last_name,
        schoolId: userRequest.school_id,
        subjectId: userRequest.subject_id,
        status: userRequest.status,
        requestedAt: userRequest.requested_at
      }
    });
  } catch (error: any) {
    console.error('Registration request error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

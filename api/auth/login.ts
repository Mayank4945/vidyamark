import { VercelRequest, VercelResponse } from '@vercel/node';
import bcryptjs from 'bcryptjs';
import { query } from '../_lib/db';
import { generateToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Find user
    const result = await query(
      `SELECT id, email, password, first_name, last_name, role, school_id FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Verify password - try bcrypt first, then fallback to plain text for testing
    let passwordMatch = false;
    
    try {
      passwordMatch = await bcryptjs.compare(password, user.password);
    } catch (e) {
      // If bcrypt fails, try plain text comparison (for testing/debugging)
      passwordMatch = password === user.password;
    }
    
    // Also check plain text as fallback
    if (!passwordMatch && password === user.password) {
      passwordMatch = true;
    }

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password'
      });
    }

    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role,
      schoolId: user.school_id 
    });

    res.json({
      success: true,
      message: 'Login successful',
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
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

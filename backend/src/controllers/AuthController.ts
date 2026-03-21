import { Request, Response } from 'express';
import { query } from '../database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

export class AuthController {
  /**
   * Register a new user (teacher/admin)
   */
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, schoolId } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'email, password, firstName, and lastName are required'
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

      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password, first_name, last_name, school_id, role)
         VALUES ($1, $2, $3, $4, $5, 'teacher')
         RETURNING id, email, first_name, last_name, role, school_id, created_at`,
        [email, hashedPassword, firstName, lastName, schoolId || null]
      );

      const user = result.rows[0];

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.school_id
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to register user'
      });
    }
  }

  /**
   * Login user
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'email and password are required'
        });
      }

      // Find user by email
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'This account is inactive'
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // Generate token
      const token = generateToken({
        id: user.id,
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
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to login'
      });
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No user authenticated'
        });
      }

      const result = await query(
        `SELECT id, email, first_name, last_name, role, school_id, is_active, created_at
         FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      const user = result.rows[0];

      res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          schoolId: user.school_id
        }
      });
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to get user info'
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No user authenticated'
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'currentPassword and newPassword are required'
        });
      }

      // Get user
      const result = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      const user = result.rows[0];

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);

      if (!validPassword) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to change password'
      });
    }
  }
}

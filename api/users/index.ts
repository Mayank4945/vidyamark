import { VercelRequest, VercelResponse } from '@vercel/node';
import bcryptjs from 'bcryptjs';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  const decoded = verifyToken(token);
  if (!token || !decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get current user info
  const userResult = await query('SELECT role, school_id FROM users WHERE id = $1', [decoded.userId]);
  if (userResult.rows.length === 0) {
    return res.status(401).json({ error: 'User not found' });
  }

  const currentUserRole = userResult.rows[0].role;
  const currentUserSchoolId = userResult.rows[0].school_id;

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  if (req.method === 'GET') {
    try {
      const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : null;
      const role = req.query.role as string;

      let sql = 'SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.school_id, u.status, u.is_active, u.subject_id, u.created_at, s.name as school_name, subj.name as subject_name FROM users u LEFT JOIN schools s ON u.school_id = s.id LEFT JOIN subjects subj ON u.subject_id = subj.id WHERE 1=1';
      const params: any[] = [];

      // Main admin sees all users
      // School admin sees only their school's users
      if (currentUserRole === 'main_admin') {
        // Can filter by schoolId if provided
        if (schoolId) {
          sql += ' AND u.school_id = $' + (params.length + 1);
          params.push(schoolId);
        }
      } else if (currentUserRole === 'school_admin') {
        sql += ' AND u.school_id = $' + (params.length + 1);
        params.push(currentUserSchoolId);
      } else {
        // Teachers can only see themselves
        sql += ' AND u.id = $' + (params.length + 1);
        params.push(decoded.userId);
      }

      if (role && ['main_admin', 'school_admin', 'teacher'].includes(role)) {
        sql += ' AND u.role = $' + (params.length + 1);
        params.push(role);
      }

      sql += ' ORDER BY u.created_at DESC';

      const result = await query(sql, params);

      res.json({
        success: true,
        data: result.rows.map((row: any) => ({
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          role: row.role,
          schoolId: row.school_id,
          schoolName: row.school_name,
          subjectId: row.subject_id,
          subjectName: row.subject_name,
          status: row.status,
          isActive: row.is_active,
          createdAt: row.created_at
        })),
        count: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { email, password, firstName, lastName, schoolId, subjectId, role } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !role) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Email, password, firstName, lastName, and role are required'
        });
      }

      // Teachers must have a school and subject
      if (role === 'teacher' && (!schoolId || !subjectId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'schoolId and subjectId are required for teachers'
        });
      }

      // School admins must have a school
      if (role === 'school_admin' && !schoolId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'schoolId is required for school admins'
        });
      }

      // Authorization check
      if (currentUserRole !== 'main_admin') {
        return res.status(403).json({ error: 'Only main admin can create users' });
      }

      // If creating for a school, verify authorization
      if (schoolId && currentUserRole === 'school_admin' && currentUserSchoolId !== schoolId) {
        return res.status(403).json({ error: 'Cannot create users for other schools' });
      }

      // Check if email already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(password, 10);

      // Create user
      const result = await query(
        `INSERT INTO users (email, password, first_name, last_name, school_id, subject_id, role, status, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', true, $8)
         RETURNING id, email, first_name, last_name, role, school_id, subject_id`,
        [email, hashedPassword, firstName, lastName, schoolId || null, subjectId || null, role, decoded.userId]
      );

      const newUser = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role,
          schoolId: newUser.school_id,
          subjectId: newUser.subject_id
        }
      });
    } catch (error: any) {
      console.error('User creation error:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, firstName, lastName, password, subjectId } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User id is required' });
      }

      // Check authorization
      if (currentUserRole === 'teacher' && id !== decoded.userId) {
        return res.status(403).json({ error: 'Can only edit your own profile' });
      }

      // Get the user to check school
      const userCheck = await query('SELECT school_id FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (currentUserRole === 'school_admin' && currentUserSchoolId !== userCheck.rows[0].school_id) {
        return res.status(403).json({ error: 'Cannot edit users from other schools' });
      }

      // Build update query
      let updateSql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      const params: any[] = [];

      if (firstName) {
        updateSql += ', first_name = $' + (params.length + 1);
        params.push(firstName);
      }
      if (lastName) {
        updateSql += ', last_name = $' + (params.length + 1);
        params.push(lastName);
      }
      if (password) {
        const hashedPassword = await bcryptjs.hash(password, 10);
        updateSql += ', password = $' + (params.length + 1);
        params.push(hashedPassword);
      }
      if (subjectId) {
        updateSql += ', subject_id = $' + (params.length + 1);
        params.push(subjectId);
      }

      updateSql += ' WHERE id = $' + (params.length + 1);
      params.push(id);
      updateSql += ' RETURNING id, email, first_name, last_name, role, school_id, subject_id';

      const result = await query(updateSql, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = result.rows[0];

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          role: updatedUser.role,
          schoolId: updatedUser.school_id,
          subjectId: updatedUser.subject_id
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User id is required' });
      }

      // Authorization check
      if (currentUserRole !== 'main_admin' && currentUserRole !== 'school_admin') {
        return res.status(403).json({ error: 'Only admins can delete users' });
      }

      // Get user to check school
      const userCheck = await query('SELECT school_id, role FROM users WHERE id = $1', [id]);
      if (userCheck.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // School admin can only delete teachers from their school
      if (currentUserRole === 'school_admin') {
        if (currentUserSchoolId !== userCheck.rows[0].school_id || userCheck.rows[0].role !== 'teacher') {
          return res.status(403).json({ error: 'Can only delete teachers from your school' });
        }
      }

      // Prevent deletion of main admin
      if (userCheck.rows[0].role === 'main_admin') {
        return res.status(403).json({ error: 'Cannot delete main admin' });
      }

      await query('DELETE FROM users WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

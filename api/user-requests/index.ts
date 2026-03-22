import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/db';
import { extractToken, verifyToken } from '../../_lib/auth';

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  const decoded = verifyToken(token);
  if (!token || !decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get current user's role
  const userResult = await query('SELECT role, school_id FROM users WHERE id = $1', [decoded.userId]);
  if (userResult.rows.length === 0) {
    return res.status(401).json({ error: 'User not found' });
  }

  const userRole = userResult.rows[0].role;
  const userSchoolId = userResult.rows[0].school_id;

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  if (req.method === 'GET') {
    try {
      let sql = 'SELECT ur.*, s.name as school_name, subj.name as subject_name FROM user_requests ur INNER JOIN schools s ON ur.school_id = s.id INNER JOIN subjects subj ON ur.subject_id = subj.id WHERE 1=1';
      const params: any[] = [];

      // Main admin sees all requests
      // School admin sees only their school's requests
      if (userRole !== 'main_admin') {
        sql += ' AND ur.school_id = $' + (params.length + 1);
        params.push(userSchoolId);
      }

      sql += ' ORDER BY ur.requested_at DESC';

      const result = await query(sql, params);

      res.json({
        success: true,
        data: result.rows.map((row: any) => ({
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          schoolId: row.school_id,
          schoolName: row.school_name,
          subjectId: row.subject_id,
          subjectName: row.subject_name,
          role: row.role,
          status: row.status,
          rejectionReason: row.rejection_reason,
          requestedAt: row.requested_at
        })),
        count: result.rows.length
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { requestId, action, rejectionReason } = req.body; // action: 'approve' or 'reject'

      if (!requestId || !action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Bad Request: requestId and valid action required' });
      }

      // Get the request
      const requestData = await query('SELECT * FROM user_requests WHERE id = $1', [requestId]);
      if (requestData.rows.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }

      const userRequest = requestData.rows[0];

      // Check authorization: main_admin can approve any, school_admin can only approve their school
      if (userRole !== 'main_admin' && userRequest.school_id !== userSchoolId) {
        return res.status(403).json({ error: 'Forbidden: Cannot approve requests for other schools' });
      }

      if (action === 'approve') {
        // Create the user account
        const userResult = await query(
          `INSERT INTO users (email, password, first_name, last_name, school_id, subject_id, role, status, is_active, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', true, $8)
           RETURNING id, email, first_name, last_name, school_id, role`,
          [userRequest.email, userRequest.password_hash, userRequest.first_name, userRequest.last_name, userRequest.school_id, userRequest.subject_id, userRequest.role, decoded.userId]
        );

        // Update request status
        await query(
          'UPDATE user_requests SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['approved', decoded.userId, requestId]
        );

        const newUser = userResult.rows[0];
        res.json({
          success: true,
          message: 'Request approved and user account created',
          data: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            schoolId: newUser.school_id,
            role: newUser.role
          }
        });
      } else if (action === 'reject') {
        if (!rejectionReason) {
          return res.status(400).json({ error: 'Rejection reason is required' });
        }

        // Update request status to rejected
        await query(
          'UPDATE user_requests SET status = $1, rejection_reason = $2, approved_by = $3, approved_at = CURRENT_TIMESTAMP WHERE id = $4',
          ['rejected', rejectionReason, decoded.userId, requestId]
        );

        res.json({
          success: true,
          message: 'Request rejected',
          data: { requestId, action: 'rejected' }
        });
      }
    } catch (error: any) {
      console.error('User request approval error:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

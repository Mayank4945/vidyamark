import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

/**
 * Calculate weighted grade for a student
 * Used internally by grade calculation endpoints
 */
async function calculateStudentGrade(
  studentId: number,
  classId: number,
  academicYearId: number,
  schoolId: number
) {
  const policyResult = await query(
    `SELECT gp.*, 
            json_agg(json_build_object('exam_type', etw.exam_type, 'display_name', etw.display_name, 'weight_percentage', etw.weight_percentage) ORDER BY etw.sequence_order) as weightages
     FROM grading_policies gp
     LEFT JOIN exam_type_weightages etw ON gp.id = etw.grading_policy_id
     WHERE gp.school_id = $1 AND gp.academic_year_id = $2 AND gp.is_active = true
     GROUP BY gp.id`,
    [schoolId, academicYearId]
  );

  if (policyResult.rows.length === 0) {
    throw new Error('No active grading policy found for this academic year');
  }

  const policy = policyResult.rows[0];
  const weightages = policy.weightages.filter((w: any) => w.exam_type !== null);

  const examsResult = await query(
    `SELECT 
      e.id, 
      e.exam_type, 
      e.exam_name,
      e.max_marks,
      e.passing_marks,
      m.marks_obtained,
      m.is_absent
     FROM exams e
     LEFT JOIN marks m ON e.id = m.exam_id AND m.student_id = $1
     WHERE (e.class_id = $2 OR e.school_id = $3)
       AND e.academic_year_id = $4
       AND e.exam_type IS NOT NULL
     ORDER BY e.exam_type, e.id`,
    [studentId, classId, schoolId, academicYearId]
  );

  const exams = examsResult.rows;

  if (exams.length === 0) {
    return {
      weighted_percentage: null,
      grade_letter: null,
      grade_point: null,
      total_exams_taken: 0,
      total_exams_missed: 0,
      calculation_details: null
    };
  }

  const examTypeScores: { [key: string]: number[] } = {};
  let totalExamsTaken = 0;
  let totalExamsMissed = 0;

  exams.forEach((exam: any) => {
    if (!examTypeScores[exam.exam_type]) {
      examTypeScores[exam.exam_type] = [];
    }

    if (exam.marks_obtained !== null && !exam.is_absent) {
      const percentage = (exam.marks_obtained / exam.max_marks) * 100;
      examTypeScores[exam.exam_type].push(percentage);
      totalExamsTaken++;
    } else if (exam.is_absent) {
      totalExamsMissed++;
    }
  });

  let totalWeightedScore = 0;
  const calculationBreakdown: any[] = [];

  for (const weightage of weightages) {
    const scores = examTypeScores[weightage.exam_type] || [];
    const avgScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
    const contribution = (avgScore * weightage.weight_percentage) / 100;

    totalWeightedScore += contribution;

    calculationBreakdown.push({
      exam_type: weightage.display_name,
      weight_percentage: weightage.weight_percentage,
      average_score: Math.round(avgScore * 100) / 100,
      contribution: Math.round(contribution * 100) / 100,
      exams_taken: scores.length
    });
  }

  const finalPercentage = Math.round(totalWeightedScore * 100) / 100;

  const gradeResult = await query(
    `SELECT grade_letter, grade_point
     FROM grade_scales
     WHERE school_id = $1 AND min_percentage <= $2 AND max_percentage >= $2
     LIMIT 1`,
    [schoolId, finalPercentage]
  );

  const gradeInfo = gradeResult.rows[0] || { grade_letter: 'F', grade_point: 0 };

  return {
    weighted_percentage: finalPercentage,
    grade_letter: gradeInfo.grade_letter,
    grade_point: gradeInfo.grade_point,
    total_exams_taken: totalExamsTaken,
    total_exams_missed: totalExamsMissed,
    calculation_details: calculationBreakdown
  };
}

// ============================================================================
// ACADEMIC YEARS HANDLERS
// ============================================================================

async function handleAcademicYearsGET(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const includeInactive = req.query.includeInactive === 'true';

    let sql = `
      SELECT id, name, start_date, end_date, is_active, created_at, updated_at
      FROM academic_years
      WHERE school_id = $1
    `;

    if (!includeInactive) {
      sql += ` AND is_active = true`;
    }

    sql += ` ORDER BY start_date DESC`;

    const result = await query(sql, [userSchoolId]);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching academic years:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleAcademicYearsPOST(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const { name, start_date, end_date, is_active } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields: name, start_date, end_date' });
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'start_date must be before end_date' });
    }

    const existCheck = await query(
      'SELECT * FROM academic_years WHERE school_id = $1 AND name = $2',
      [userSchoolId, name]
    );

    if (existCheck.rows.length > 0) {
      return res.status(400).json({ error: `Academic year '${name}' already exists for your school` });
    }

    if (is_active) {
      await query(
        'UPDATE academic_years SET is_active = false WHERE school_id = $1',
        [userSchoolId]
      );
    }

    const result = await query(
      `INSERT INTO academic_years (school_id, name, start_date, end_date, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userSchoolId, name, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], is_active || false, decoded.userId]
    );

    res.status(201).json({
      success: true,
      message: 'Academic year created successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating academic year:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleAcademicYearsPUT(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const { id, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const ayCheck = await query(
      'SELECT * FROM academic_years WHERE id = $1 AND school_id = $2',
      [id, userSchoolId]
    );

    if (ayCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Academic year not found' });
    }

    if (is_active) {
      await query(
        'UPDATE academic_years SET is_active = false WHERE school_id = $1 AND id != $2',
        [userSchoolId, id]
      );
    }

    const result = await query(
      'UPDATE academic_years SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [is_active || false, id]
    );

    res.json({
      success: true,
      message: 'Academic year updated successfully',
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating academic year:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleAcademicYearsDELETE(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const ayCheck = await query(
      'SELECT * FROM academic_years WHERE id = $1 AND school_id = $2',
      [id, userSchoolId]
    );

    if (ayCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Academic year not found' });
    }

    const examsCheck = await query(
      'SELECT COUNT(*) as count FROM exams WHERE academic_year_id = $1',
      [id]
    );

    if (examsCheck.rows[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete academic year with existing exams' });
    }

    await query('DELETE FROM academic_years WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Academic year deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting academic year:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// GRADING POLICIES HANDLERS
// ============================================================================

async function handleGradingPoliciesGET(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId as string) : null;

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
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', id,
            'exam_type', exam_type,
            'display_name', display_name,
            'weight_percentage', weight_percentage,
            'sequence_order', sequence_order
          ) ORDER BY sequence_order)
          FROM exam_type_weightages
          WHERE grading_policy_id = gp.id),
          '[]'::json
        ) as weightages
      FROM grading_policies gp
      LEFT JOIN academic_years ay ON gp.academic_year_id = ay.id
      WHERE gp.school_id = $1
    `;

    const params = [userSchoolId];

    if (academicYearId) {
      sql += ` AND gp.academic_year_id = $2`;
      params.push(academicYearId);
    }

    sql += ` ORDER BY ay.created_at DESC, gp.created_at DESC`;

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching grading policies:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleGradingPoliciesPOST(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const { name, description, academic_year_id, weightages } = req.body;

    if (!name || !academic_year_id || !weightages || weightages.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: name, academic_year_id, weightages' });
    }

    const ayCheck = await query(
      'SELECT * FROM academic_years WHERE id = $1 AND school_id = $2',
      [academic_year_id, userSchoolId]
    );
    if (ayCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Academic year not found for your school' });
    }

    const totalWeight = weightages.reduce((sum: number, w: any) => sum + parseFloat(w.weight_percentage), 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return res.status(400).json({ error: `Weightages must sum to 100%, got ${totalWeight}%` });
    }

    const gpResult = await query(
      `INSERT INTO grading_policies (school_id, name, description, academic_year_id, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userSchoolId, name, description || null, academic_year_id, decoded.userId]
    );

    const gradingPolicyId = gpResult.rows[0].id;

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
}

async function handleGradingPoliciesPUT(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const { id, name, description, weightages, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const gpCheck = await query(
      'SELECT * FROM grading_policies WHERE id = $1 AND school_id = $2',
      [id, userSchoolId]
    );
    if (gpCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Grading policy not found' });
    }

    await query(
      `UPDATE grading_policies SET name = $1, description = $2, is_active = $3, updated_at = NOW()
       WHERE id = $4`,
      [name || gpCheck.rows[0].name, description, is_active !== undefined ? is_active : gpCheck.rows[0].is_active, id]
    );

    if (weightages && weightages.length > 0) {
      const totalWeight = weightages.reduce((sum: number, w: any) => sum + parseFloat(w.weight_percentage), 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return res.status(400).json({ error: `Weightages must sum to 100%, got ${totalWeight}%` });
      }

      await query('DELETE FROM exam_type_weightages WHERE grading_policy_id = $1', [id]);

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
}

async function handleGradingPoliciesDELETE(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const gpCheck = await query(
      'SELECT * FROM grading_policies WHERE id = $1 AND school_id = $2',
      [id, userSchoolId]
    );
    if (gpCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Grading policy not found' });
    }

    await query('DELETE FROM grading_policies WHERE id = $1', [id]);

    res.json({ success: true, message: 'Grading policy deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting grading policy:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// GRADES CALCULATION HANDLERS
// ============================================================================

async function handleGradesPOST(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const { class_id, academic_year_id } = req.body;

    if (!class_id || !academic_year_id) {
      return res.status(400).json({ error: 'Missing required fields: class_id, academic_year_id' });
    }

    const classCheck = await query(
      'SELECT * FROM classes WHERE id = $1 AND school_id = $2',
      [class_id, userSchoolId]
    );
    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Class not found' });
    }

    const ayCheck = await query(
      'SELECT * FROM academic_years WHERE id = $1 AND school_id = $2',
      [academic_year_id, userSchoolId]
    );
    if (ayCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Academic year not found' });
    }

    const logResult = await query(
      `INSERT INTO grade_calculation_logs (school_id, class_id, academic_year_id, calculation_status, calculated_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [userSchoolId, class_id, academic_year_id, 'in_progress', decoded.userId]
    );

    const logId = logResult.rows[0].id;

    try {
      const studentsResult = await query(
        'SELECT id FROM students WHERE class_id = $1 AND school_id = $2',
        [class_id, userSchoolId]
      );

      let successCount = 0;
      const errors: any[] = [];

      for (const student of studentsResult.rows) {
        try {
          const gradeData = await calculateStudentGrade(
            student.id,
            class_id,
            academic_year_id,
            userSchoolId
          );

          await query(
            `INSERT INTO calculated_grades 
             (student_id, class_id, academic_year_id, weighted_percentage, grade_letter, grade_point, 
              total_exams_taken, total_exams_missed, calculation_details, calculated_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (student_id, class_id, academic_year_id, subject_id)
             DO UPDATE SET
               weighted_percentage = EXCLUDED.weighted_percentage,
               grade_letter = EXCLUDED.grade_letter,
               grade_point = EXCLUDED.grade_point,
               total_exams_taken = EXCLUDED.total_exams_taken,
               total_exams_missed = EXCLUDED.total_exams_missed,
               calculation_details = EXCLUDED.calculation_details,
               calculated_at = NOW()`,
            [
              student.id,
              class_id,
              academic_year_id,
              gradeData.weighted_percentage,
              gradeData.grade_letter,
              gradeData.grade_point,
              gradeData.total_exams_taken,
              gradeData.total_exams_missed,
              JSON.stringify(gradeData.calculation_details),
              decoded.userId
            ]
          );

          successCount++;
        } catch (error: any) {
          errors.push({ student_id: student.id, error: error.message });
        }
      }

      await query(
        `UPDATE grade_calculation_logs 
         SET calculation_status = $1, students_processed = $2, completed_at = NOW()
         WHERE id = $3`,
        ['completed', successCount, logId]
      );

      res.json({
        success: true,
        message: `Grades calculated for ${successCount} students`,
        data: {
          students_processed: successCount,
          total_students: studentsResult.rows.length,
          errors: errors.length > 0 ? errors : null
        }
      });
    } catch (error: any) {
      await query(
        `UPDATE grade_calculation_logs 
         SET calculation_status = $1, error_message = $2, completed_at = NOW()
         WHERE id = $3`,
        ['failed', error.message, logId]
      );
      throw error;
    }
  } catch (error: any) {
    console.error('Error calculating grades:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleGradesGET(req: VercelRequest, res: VercelResponse, decoded: any, userSchoolId: number) {
  try {
    const classId = req.query.classId ? parseInt(req.query.classId as string) : null;
    const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId as string) : null;

    if (!classId || !academicYearId) {
      return res.status(400).json({ error: 'Missing required parameters: classId, academicYearId' });
    }

    const result = await query(
      `SELECT 
        cg.id,
        cg.student_id,
        s.first_name,
        s.last_name,
        s.roll_number,
        cg.weighted_percentage,
        cg.grade_letter,
        cg.grade_point,
        cg.total_exams_taken,
        cg.total_exams_missed,
        cg.calculation_details,
        cg.calculated_at
       FROM calculated_grades cg
       JOIN students s ON cg.student_id = s.id
       WHERE cg.class_id = $1 AND cg.academic_year_id = $2 AND cg.subject_id IS NULL
       ORDER BY cg.weighted_percentage DESC NULLS LAST, s.first_name`,
      [classId, academicYearId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('Error fetching calculated grades:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export default async (req: VercelRequest, res: VercelResponse) => {
  const resource = req.query.resource as string || 'academic-years';

  // Health check endpoint - no auth required
  if (resource === 'health') {
    return res.status(200).json({
      status: 'OK',
      message: '🎓 VidyaMark API is live and ready to serve!',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    });
  }

  const token = extractToken(req.headers.authorization);
  const decoded = verifyToken(token);
  if (!token || !decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userSchoolId = decoded.schoolId;
  const userRole = decoded.role;

  // Only admins, principals, and school admins can manage grading system
  if (userRole !== 'admin' && userRole !== 'principal' && userRole !== 'school_admin') {
    return res.status(403).json({ error: 'Forbidden: Only admins can manage grading system' });
  }

  try {
    if (resource === 'academic-years') {
      if (req.method === 'GET') {
        return handleAcademicYearsGET(req, res, decoded, userSchoolId);
      } else if (req.method === 'POST') {
        return handleAcademicYearsPOST(req, res, decoded, userSchoolId);
      } else if (req.method === 'PUT') {
        return handleAcademicYearsPUT(req, res, decoded, userSchoolId);
      } else if (req.method === 'DELETE') {
        return handleAcademicYearsDELETE(req, res, decoded, userSchoolId);
      }
    } else if (resource === 'grading-policies') {
      if (req.method === 'GET') {
        return handleGradingPoliciesGET(req, res, decoded, userSchoolId);
      } else if (req.method === 'POST') {
        return handleGradingPoliciesPOST(req, res, decoded, userSchoolId);
      } else if (req.method === 'PUT') {
        return handleGradingPoliciesPUT(req, res, decoded, userSchoolId);
      } else if (req.method === 'DELETE') {
        return handleGradingPoliciesDELETE(req, res, decoded, userSchoolId);
      }
    } else if (resource === 'grades') {
      if (req.method === 'POST') {
        return handleGradesPOST(req, res, decoded, userSchoolId);
      } else if (req.method === 'GET') {
        return handleGradesGET(req, res, decoded, userSchoolId);
      }
    } else {
      return res.status(400).json({ error: 'Invalid resource parameter' });
    }

    res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Grading endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
};

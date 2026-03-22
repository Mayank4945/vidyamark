import { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/db';
import { extractToken, verifyToken } from '../_lib/auth';

/**
 * Calculate weighted grade for a student
 * Takes into account:
 * 1. All exams for the student in a given academic year and class
 * 2. Exam type weightages from grading policy
 * 3. Actual marks obtained scaled appropriately
 * 4. Converts to letter grade based on school's grade scale
 */
async function calculateStudentGrade(
  studentId: number,
  classId: number,
  academicYearId: number,
  schoolId: number
) {
  // Get the grading policy for this academic year
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

  // Get all exams for this student in the given class and academic year
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

  // Group exams by type and calculate average for each type
  const examTypeScores: { [key: string]: number[] } = {};
  let totalExamsTaken = 0;
  let totalExamsMissed = 0;

  exams.forEach((exam: any) => {
    if (!examTypeScores[exam.exam_type]) {
      examTypeScores[exam.exam_type] = [];
    }

    if (exam.marks_obtained !== null && !exam.is_absent) {
      // Convert marks to percentage
      const percentage = (exam.marks_obtained / exam.max_marks) * 100;
      examTypeScores[exam.exam_type].push(percentage);
      totalExamsTaken++;
    } else if (exam.is_absent) {
      totalExamsMissed++;
    }
  });

  // Calculate weighted percentage
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

  // Get grade letter and grade point from grade scales
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

export default async (req: VercelRequest, res: VercelResponse) => {
  const token = extractToken(req.headers.authorization);
  const decoded = verifyToken(token);
  if (!token || !decoded) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userSchoolId = decoded.schoolId;

  if (req.method === 'POST') {
    try {
      const { class_id, academic_year_id } = req.body;

      if (!class_id || !academic_year_id) {
        return res.status(400).json({ error: 'Missing required fields: class_id, academic_year_id' });
      }

      // Verify class belongs to school
      const classCheck = await query(
        'SELECT * FROM classes WHERE id = $1 AND school_id = $2',
        [class_id, userSchoolId]
      );
      if (classCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Class not found' });
      }

      // Verify academic year belongs to school
      const ayCheck = await query(
        'SELECT * FROM academic_years WHERE id = $1 AND school_id = $2',
        [academic_year_id, userSchoolId]
      );
      if (ayCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Academic year not found' });
      }

      // Start logging
      const logResult = await query(
        `INSERT INTO grade_calculation_logs (school_id, class_id, academic_year_id, calculation_status, calculated_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userSchoolId, class_id, academic_year_id, 'in_progress', decoded.userId]
      );

      const logId = logResult.rows[0].id;

      try {
        // Get all students in the class
        const studentsResult = await query(
          'SELECT id FROM students WHERE class_id = $1 AND school_id = $2',
          [class_id, userSchoolId]
        );

        let successCount = 0;
        const errors: any[] = [];

        // Calculate grade for each student
        for (const student of studentsResult.rows) {
          try {
            const gradeData = await calculateStudentGrade(
              student.id,
              class_id,
              academic_year_id,
              userSchoolId
            );

            // Insert or update calculated grade
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

        // Update log
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
        // Update log with error
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
  } else if (req.method === 'GET') {
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
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};

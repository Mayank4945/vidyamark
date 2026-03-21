import { query } from '../database';
import { Marks, MarksDTO } from '../models';

export class MarksService {
  /**
   * Add or update marks for a student in an exam
   */
  static async upsertMarks(examId: number, studentId: number, marksObtained: number, remarks?: string) {
    const result = await query(
      `INSERT INTO marks (exam_id, student_id, marks_obtained, remarks)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (exam_id, student_id) 
       DO UPDATE SET marks_obtained = $3, remarks = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [examId, studentId, marksObtained, remarks]
    );

    return result.rows[0];
  }

  /**
   * Get all marks for an exam
   */
  static async getMarksByExam(examId: number): Promise<MarksDTO[]> {
    const result = await query(
      `SELECT 
        m.student_id as "studentId",
        CONCAT(s.first_name, ' ', s.last_name) as "studentName",
        m.marks_obtained as "marksObtained",
        ROUND((m.marks_obtained / e.max_marks) * 100, 2) as percentage,
        m.remarks,
        m.is_absent as "isAbsent"
       FROM marks m
       JOIN students s ON m.student_id = s.id
       JOIN exams e ON m.exam_id = e.id
       WHERE m.exam_id = $1
       ORDER BY s.roll_number`,
      [examId]
    );

    return result.rows;
  }

  /**
   * Get marks for a student in a subject
   */
  static async getStudentSubjectMarks(studentId: number, subjectId: number) {
    const result = await query(
      `SELECT 
        e.id as "examId",
        e.exam_name as "examName",
        e.exam_type as "examType",
        m.marks_obtained as "marksObtained",
        e.max_marks as "maxMarks",
        ROUND((m.marks_obtained / e.max_marks) * 100, 2) as percentage,
        m.is_absent as "isAbsent"
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       WHERE m.student_id = $1 AND e.subject_id = $2
       ORDER BY e.exam_date DESC`,
      [studentId, subjectId]
    );

    return result.rows;
  }

  /**
   * Calculate grades for a student in a subject for a semester
   */
  static async calculateStudentSubjectGrade(
    studentId: number,
    classId: number,
    subjectId: number,
    semester: string,
    academicYear: string
  ) {
    // Get all marks for the student in this subject
    const marksResult = await query(
      `SELECT 
        SUM(m.marks_obtained) as total_obtained,
        SUM(e.max_marks) as total_possible,
        AVG(ROUND((m.marks_obtained / e.max_marks) * 100, 2)) as avg_percentage
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       WHERE m.student_id = $1 AND e.subject_id = $2`,
      [studentId, subjectId]
    );

    const marks = marksResult.rows[0];
    
    if (!marks || marks.total_possible === null) {
      return null;
    }

    const percentage = (marks.total_obtained / marks.total_possible) * 100;

    // Get grade based on percentage
    const gradeResult = await query(
      `SELECT grade_name, grade_point 
       FROM grade_configurations 
       WHERE school_id = (SELECT school_id FROM classes WHERE id = $1)
       AND min_percentage <= $2 AND max_percentage >= $2
       ORDER BY min_percentage DESC
       LIMIT 1`,
      [classId, percentage]
    );

    const grade = gradeResult.rows[0];

    // Save class performance
    const result = await query(
      `INSERT INTO class_performance
       (class_id, student_id, subject_id, total_marks_obtained, total_marks_possible, percentage, grade, semester, academic_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (class_id, student_id, subject_id, semester, academic_year)
       DO UPDATE SET 
        total_marks_obtained = $4,
        total_marks_possible = $5,
        percentage = $6,
        grade = $7,
        updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [classId, studentId, subjectId, marks.total_obtained, marks.total_possible, percentage, grade?.grade_name || 'F', semester, academicYear]
    );

    return result.rows[0];
  }

  /**
   * Get absent students for an exam
   */
  static async getAbsentStudents(examId: number) {
    const result = await query(
      `SELECT 
        s.id,
        s.roll_number as "rollNumber",
        CONCAT(s.first_name, ' ', s.last_name) as "studentName"
       FROM marks m
       JOIN students s ON m.student_id = s.id
       WHERE m.exam_id = $1 AND m.is_absent = true`,
      [examId]
    );

    return result.rows;
  }

  /**
   * Mark student as absent
   */
  static async markAbsent(examId: number, studentId: number) {
    const result = await query(
      `INSERT INTO marks (exam_id, student_id, marks_obtained, is_absent)
       VALUES ($1, $2, 0, true)
       ON CONFLICT (exam_id, student_id)
       DO UPDATE SET is_absent = true, marks_obtained = 0, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [examId, studentId]
    );

    return result.rows[0];
  }
}

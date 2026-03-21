import { query } from '../database';
import { Exam, ExamDTO } from '../models';

export class ExamService {
  /**
   * Create a new exam
   */
  static async createExam(data: Partial<Exam>) {
    const {
      classId,
      subjectId,
      examType,
      examName,
      examDate,
      maxMarks,
      weightage,
      passingMarks,
      description,
      createdBy
    } = data;

    const result = await query(
      `INSERT INTO exams 
       (class_id, subject_id, exam_type, exam_name, exam_date, max_marks, weightage, passing_marks, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [classId, subjectId, examType, examName, examDate, maxMarks, weightage, passingMarks, description, createdBy]
    );

    return result.rows[0];
  }

  /**
   * Get all exams for a class
   */
  static async getExamsByClass(classId: number): Promise<ExamDTO[]> {
    const result = await query(
      `SELECT 
        e.id,
        e.exam_name as "examName",
        e.exam_type as "examType",
        e.exam_date as "examDate",
        e.max_marks as "maxMarks",
        s.name as "subjectName"
       FROM exams e
       JOIN subjects s ON e.subject_id = s.id
       WHERE e.class_id = $1
       ORDER BY e.exam_date DESC`,
      [classId]
    );

    return result.rows;
  }

  /**
   * Get exams for a specific subject/class combination
   */
  static async getExamsBySubject(classId: number, subjectId: number) {
    const result = await query(
      `SELECT * FROM exams 
       WHERE class_id = $1 AND subject_id = $2
       ORDER BY exam_date DESC`,
      [classId, subjectId]
    );

    return result.rows;
  }

  /**
   * Get exam by ID with full details
   */
  static async getExamById(examId: number) {
    const result = await query(
      `SELECT 
        e.*,
        s.name as "subjectName",
        c.name as "className"
       FROM exams e
       JOIN subjects s ON e.subject_id = s.id
       JOIN classes c ON e.class_id = c.id
       WHERE e.id = $1`,
      [examId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update exam
   */
  static async updateExam(examId: number, data: Partial<Exam>) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) return null;

    values.push(examId);
    const result = await query(
      `UPDATE exams SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete exam
   */
  static async deleteExam(examId: number) {
    // Delete marks first (due to foreign key constraint)
    await query(`DELETE FROM marks WHERE exam_id = $1`, [examId]);
    
    // Then delete exam
    const result = await query(
      `DELETE FROM exams WHERE id = $1 RETURNING *`,
      [examId]
    );

    return result.rows[0];
  }

  /**
   * Get exam statistics
   */
  static async getExamStatistics(examId: number) {
    const result = await query(
      `SELECT 
        COUNT(m.id) as total_students,
        COUNT(CASE WHEN m.is_absent THEN 1 END) as absent_count,
        ROUND(AVG(m.marks_obtained), 2) as class_average,
        MAX(m.marks_obtained) as highest_marks,
        MIN(m.marks_obtained) as lowest_marks,
        ROUND(STDDEV(m.marks_obtained), 2) as standard_deviation,
        ROUND((COUNT(CASE WHEN (m.marks_obtained / e.max_marks * 100) >= e.passing_marks THEN 1 END) * 100.0 / COUNT(m.id)), 2) as pass_percentage
       FROM marks m
       JOIN exams e ON m.exam_id = e.id
       WHERE m.exam_id = $1`,
      [examId]
    );

    return result.rows[0];
  }
}

import { query, transaction } from '../database';
import { Student, StudentDTO } from '../models';
import bcrypt from 'bcryptjs';

export class StudentService {
  /**
   * Create a new student
   */
  static async createStudent(data: Partial<Student>) {
    const {
      classId,
      schoolId,
      rollNumber,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      parentName,
      parentContact
    } = data;

    const result = await query(
      `INSERT INTO students 
       (class_id, school_id, roll_number, first_name, last_name, email, phone, date_of_birth, gender, parent_name, parent_contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [classId, schoolId, rollNumber, firstName, lastName, email, phone, dateOfBirth, gender, parentName, parentContact]
    );

    return result.rows[0];
  }

  /**
   * Get all students for a class
   */
  static async getStudentsByClass(classId: number): Promise<StudentDTO[]> {
    const result = await query(
      `SELECT id, roll_number as "rollNumber", first_name as "firstName", 
              last_name as "lastName", email, phone, parent_name as "parentName", 
              parent_contact as "parentContact"
       FROM students 
       WHERE class_id = $1 AND is_active = true
       ORDER BY roll_number`,
      [classId]
    );

    return result.rows.map((row: any) => ({
      ...row,
      fullName: `${row.firstName} ${row.lastName}`
    }));
  }

  /**
   * Get all students for a school
   */
  static async getStudentsBySchool(schoolId: number): Promise<StudentDTO[]> {
    const result = await query(
      `SELECT id, roll_number as "rollNumber", first_name as "firstName", 
              last_name as "lastName", email, phone, parent_name as "parentName", 
              parent_contact as "parentContact"
       FROM students 
       WHERE school_id = $1 AND is_active = true
       ORDER BY first_name, last_name`,
      [schoolId]
    );

    return result.rows.map((row: any) => ({
      ...row,
      fullName: `${row.firstName} ${row.lastName}`
    }));
  }

  /**
   * Get student by ID
   */
  static async getStudentById(studentId: number): Promise<Student | null> {
    const result = await query(
      `SELECT * FROM students WHERE id = $1 AND is_active = true`,
      [studentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update student
   */
  static async updateStudent(studentId: number, data: Partial<Student>) {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updates.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (updates.length === 0) return null;

    values.push(studentId);
    const result = await query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  /**
   * Delete student (soft delete)
   */
  static async deleteStudent(studentId: number) {
    const result = await query(
      `UPDATE students SET is_active = false WHERE id = $1 RETURNING *`,
      [studentId]
    );

    return result.rows[0];
  }

  /**
   * Bulk import students
   */
  static async bulkImportStudents(classId: number, schoolId: number, studentsData: any[]) {
    let importedCount = 0;
    const errors: any[] = [];

    for (const student of studentsData) {
      try {
        await this.createStudent({
          classId,
          schoolId,
          rollNumber: student.rollNumber,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone,
          dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : undefined,
          gender: student.gender,
          parentName: student.parentName,
          parentContact: student.parentContact
        });
        importedCount++;
      } catch (error) {
        errors.push({
          student: `${student.firstName} ${student.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return { importedCount, errors };
  }
}

import { Request, Response } from 'express';
import { StudentService } from '../services/StudentService';

export class StudentController {
  /**
   * Get all students for a class
   */
  static async getStudentsByClass(req: Request, res: Response) {
    try {
      const { classId } = req.query;

      if (!classId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'classId query parameter is required'
        });
      }

      const students = await StudentService.getStudentsByClass(parseInt(classId as string));
      
      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch students'
      });
    }
  }

  /**
   * Get all students for a school
   */
  static async getStudentsBySchool(req: Request, res: Response) {
    try {
      const { schoolId } = req.query;

      if (!schoolId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'schoolId query parameter is required'
        });
      }

      const students = await StudentService.getStudentsBySchool(parseInt(schoolId as string));
      
      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch students'
      });
    }
  }

  /**
   * Get student by ID
   */
  static async getStudentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await StudentService.getStudentById(parseInt(id));

      if (!student) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Student not found'
        });
      }

      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch student'
      });
    }
  }

  /**
   * Create a new student
   */
  static async createStudent(req: Request, res: Response) {
    try {
      const { classId, schoolId, rollNumber, firstName, lastName, email, phone, dateOfBirth, gender, parentName, parentContact } = req.body;

      // Validation
      if (!classId || !schoolId || !rollNumber || !firstName || !lastName) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'classId, schoolId, rollNumber, firstName, and lastName are required'
        });
      }

      const student = await StudentService.createStudent({
        classId,
        schoolId,
        rollNumber,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        parentName,
        parentContact
      } as any);

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error: any) {
      console.error('Error creating student:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Student with this roll number already exists in this class'
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'Failed to create student'
      });
    }
  }

  /**
   * Update a student
   */
  static async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const student = await StudentService.updateStudent(parseInt(id), updateData);

      if (!student) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Student not found'
        });
      }

      res.json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update student'
      });
    }
  }

  /**
   * Delete a student
   */
  static async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const student = await StudentService.deleteStudent(parseInt(id));

      if (!student) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Student not found'
        });
      }

      res.json({
        success: true,
        message: 'Student deleted successfully',
        data: student
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to delete student'
      });
    }
  }

  /**
   * Bulk import students
   */
  static async bulkImportStudents(req: Request, res: Response) {
    try {
      const { classId, schoolId, students } = req.body;

      if (!classId || !schoolId || !Array.isArray(students) || students.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'classId, schoolId, and students array are required'
        });
      }

      const result = await StudentService.bulkImportStudents(classId, schoolId, students);

      res.json({
        success: true,
        message: `${result.importedCount} students imported successfully`,
        data: {
          importedCount: result.importedCount,
          totalAttempted: students.length,
          errors: result.errors
        }
      });
    } catch (error) {
      console.error('Error bulk importing students:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to bulk import students'
      });
    }
  }
}

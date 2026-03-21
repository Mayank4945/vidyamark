import { Request, Response } from 'express';
import { MarksService } from '../services/MarksService';

export class MarksController {
  /**
   * Get marks for an exam
   */
  static async getMarksByExam(req: Request, res: Response) {
    try {
      const { examId } = req.query;

      if (!examId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'examId query parameter is required'
        });
      }

      const marks = await MarksService.getMarksByExam(parseInt(examId as string));

      res.json({
        success: true,
        data: marks,
        count: marks.length
      });
    } catch (error) {
      console.error('Error fetching marks:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch marks'
      });
    }
  }

  /**
   * Get marks for a student in a subject
   */
  static async getStudentSubjectMarks(req: Request, res: Response) {
    try {
      const { studentId, subjectId } = req.params;

      if (!studentId || !subjectId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'studentId and subjectId are required'
        });
      }

      const marks = await MarksService.getStudentSubjectMarks(
        parseInt(studentId),
        parseInt(subjectId)
      );

      res.json({
        success: true,
        data: marks,
        count: marks.length
      });
    } catch (error) {
      console.error('Error fetching marks:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch marks'
      });
    }
  }

  /**
   * Add or update marks
   */
  static async upsertMarks(req: Request, res: Response) {
    try {
      const { examId, studentId, marksObtained, remarks } = req.body;

      if (!examId || !studentId || marksObtained === undefined) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'examId, studentId, and marksObtained are required'
        });
      }

      const marks = await MarksService.upsertMarks(examId, studentId, marksObtained, remarks);

      res.json({
        success: true,
        message: 'Marks saved successfully',
        data: marks
      });
    } catch (error) {
      console.error('Error saving marks:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to save marks'
      });
    }
  }

  /**
   * Mark student as absent
   */
  static async markAbsent(req: Request, res: Response) {
    try {
      const { examId, studentId } = req.body;

      if (!examId || !studentId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'examId and studentId are required'
        });
      }

      const marks = await MarksService.markAbsent(examId, studentId);

      res.json({
        success: true,
        message: 'Student marked as absent',
        data: marks
      });
    } catch (error) {
      console.error('Error marking absent:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to mark absent'
      });
    }
  }

  /**
   * Calculate grades for a student
   */
  static async calculateGrades(req: Request, res: Response) {
    try {
      const { studentId, classId, subjectId, semester, academicYear } = req.body;

      if (!studentId || !classId || !subjectId || !semester || !academicYear) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'studentId, classId, subjectId, semester, and academicYear are required'
        });
      }

      const result = await MarksService.calculateStudentSubjectGrade(
        studentId,
        classId,
        subjectId,
        semester,
        academicYear
      );

      if (!result) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'No marks found for this student in this subject'
        });
      }

      res.json({
        success: true,
        message: 'Grade calculated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error calculating grades:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to calculate grades'
      });
    }
  }

  /**
   * Get absent students for an exam
   */
  static async getAbsentStudents(req: Request, res: Response) {
    try {
      const { examId } = req.query;

      if (!examId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'examId query parameter is required'
        });
      }

      const students = await MarksService.getAbsentStudents(parseInt(examId as string));

      res.json({
        success: true,
        data: students,
        count: students.length
      });
    } catch (error) {
      console.error('Error fetching absent students:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch absent students'
      });
    }
  }
}

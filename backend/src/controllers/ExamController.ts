import { Request, Response } from 'express';
import { ExamService } from '../services/ExamService';

export class ExamController {
  /**
   * Get all exams for a class
   */
  static async getExamsByClass(req: Request, res: Response) {
    try {
      const { classId } = req.query;

      if (!classId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'classId query parameter is required'
        });
      }

      const exams = await ExamService.getExamsByClass(parseInt(classId as string));

      res.json({
        success: true,
        data: exams,
        count: exams.length
      });
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch exams'
      });
    }
  }

  /**
   * Get exams by subject
   */
  static async getExamsBySubject(req: Request, res: Response) {
    try {
      const { classId, subjectId } = req.query;

      if (!classId || !subjectId) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'classId and subjectId query parameters are required'
        });
      }

      const exams = await ExamService.getExamsBySubject(
        parseInt(classId as string),
        parseInt(subjectId as string)
      );

      res.json({
        success: true,
        data: exams,
        count: exams.length
      });
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch exams'
      });
    }
  }

  /**
   * Get exam by ID
   */
  static async getExamById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const exam = await ExamService.getExamById(parseInt(id));

      if (!exam) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Exam not found'
        });
      }

      res.json({
        success: true,
        data: exam
      });
    } catch (error) {
      console.error('Error fetching exam:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch exam'
      });
    }
  }

  /**
   * Create a new exam
   */
  static async createExam(req: Request, res: Response) {
    try {
      const { classId, subjectId, examType, examName, examDate, maxMarks, weightage, passingMarks, description } = req.body;

      if (!classId || !subjectId || !examType || !examName || !examDate || !maxMarks) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'classId, subjectId, examType, examName, examDate, and maxMarks are required'
        });
      }

      const exam = await ExamService.createExam({
        classId,
        subjectId,
        examType,
        examName,
        examDate: new Date(examDate),
        maxMarks,
        weightage: weightage || 100,
        passingMarks,
        description,
        createdBy: req.user?.id
      } as any);

      res.status(201).json({
        success: true,
        message: 'Exam created successfully',
        data: exam
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to create exam'
      });
    }
  }

  /**
   * Update exam
   */
  static async updateExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const exam = await ExamService.updateExam(parseInt(id), updateData);

      if (!exam) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Exam not found'
        });
      }

      res.json({
        success: true,
        message: 'Exam updated successfully',
        data: exam
      });
    } catch (error) {
      console.error('Error updating exam:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update exam'
      });
    }
  }

  /**
   * Delete exam
   */
  static async deleteExam(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const exam = await ExamService.deleteExam(parseInt(id));

      if (!exam) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Exam not found'
        });
      }

      res.json({
        success: true,
        message: 'Exam deleted successfully',
        data: exam
      });
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to delete exam'
      });
    }
  }

  /**
   * Get exam statistics
   */
  static async getExamStatistics(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const stats = await ExamService.getExamStatistics(parseInt(id));

      if (!stats) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Exam not found'
        });
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching exam statistics:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to fetch exam statistics'
      });
    }
  }
}

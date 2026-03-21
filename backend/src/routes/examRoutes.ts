import { Router } from 'express';
import { ExamController } from '../controllers/ExamController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All exam routes require authentication
router.use(authMiddleware);

/**
 * Get exams for a class
 */
router.get('/', ExamController.getExamsByClass);

/**
 * Get exams for a subject
 */
router.get('/subject', ExamController.getExamsBySubject);

/**
 * Get exam by ID
 */
router.get('/:id', ExamController.getExamById);

/**
 * Create a new exam
 */
router.post('/', ExamController.createExam);

/**
 * Get exam statistics
 */
router.get('/:id/statistics', ExamController.getExamStatistics);

/**
 * Update exam
 */
router.put('/:id', ExamController.updateExam);

/**
 * Delete exam
 */
router.delete('/:id', ExamController.deleteExam);

export default router;

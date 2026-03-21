import { Router } from 'express';
import { MarksController } from '../controllers/MarksController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All marks routes require authentication
router.use(authMiddleware);

/**
 * Get marks for an exam
 */
router.get('/', MarksController.getMarksByExam);

/**
 * Get marks for a student in a subject
 */
router.get('/student/:studentId/subject/:subjectId', MarksController.getStudentSubjectMarks);

/**
 * Add or update marks
 */
router.post('/', MarksController.upsertMarks);

/**
 * Mark student as absent
 */
router.post('/absent', MarksController.markAbsent);

/**
 * Calculate grades
 */
router.post('/calculate-grades', MarksController.calculateGrades);

/**
 * Get absent students for an exam
 */
router.get('/absent', MarksController.getAbsentStudents);

export default router;

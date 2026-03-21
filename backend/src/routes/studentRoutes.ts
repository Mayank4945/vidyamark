import { Router, Request, Response } from 'express';
import { StudentController } from '../controllers/StudentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All student routes require authentication
router.use(authMiddleware);

/**
 * Get students
 * Query parameters: classId OR schoolId (one is required)
 */
router.get('/', StudentController.getStudentsByClass);

/**
 * Get students by school
 */
router.get('/school/:schoolId', StudentController.getStudentsBySchool);

/**
 * Get student by ID
 */
router.get('/:id', StudentController.getStudentById);

/**
 * Create a new student
 */
router.post('/', StudentController.createStudent);

/**
 * Bulk import students
 */
router.post('/bulk-import', StudentController.bulkImportStudents);

/**
 * Update student
 */
router.put('/:id', StudentController.updateStudent);

/**
 * Delete student
 */
router.delete('/:id', StudentController.deleteStudent);

export default router;

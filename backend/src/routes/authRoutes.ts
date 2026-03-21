import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * Register a new user
 * Public route
 */
router.post('/register', AuthController.register);

/**
 * Login user
 * Public route
 */
router.post('/login', AuthController.login);

/**
 * Get current user info
 * Protected route
 */
router.get('/me', authMiddleware, AuthController.getCurrentUser);

/**
 * Change password
 * Protected route
 */
router.post('/change-password', authMiddleware, AuthController.changePassword);

export default router;

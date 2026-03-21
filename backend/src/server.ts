import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, seedDefaultSubjects, verifyDatabaseConnection } from './setup';

// Import routes
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import classRoutes from './routes/classRoutes';
import schoolRoutes from './routes/schoolRoutes';
import subjectRoutes from './routes/subjectRoutes';
import examRoutes from './routes/examRoutes';
import marksRoutes from './routes/marksRoutes';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// ===========================
// MIDDLEWARE
// ===========================

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===========================
// API ROUTES
// ===========================

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'VidyaMark API Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Student routes
app.use('/api/students', studentRoutes);

// Class routes
app.use('/api/classes', classRoutes);

// School routes
app.use('/api/schools', schoolRoutes);

// Subject routes
app.use('/api/subjects', subjectRoutes);

// Exam routes
app.use('/api/exams', examRoutes);

// Marks routes
app.use('/api/marks', marksRoutes);

// Reports routes (to be implemented)
// app.use('/api/reports', reportRoutes);

// Export routes (to be implemented)
// app.use('/api/export', exportRoutes);

// ===========================
// ERROR HANDLING
// ===========================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: err.name || 'Error',
    message: message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ===========================
// SERVER STARTUP
// ===========================

async function startServer() {
  try {
    // Verify database connection
    await verifyDatabaseConnection();
    
    // Initialize database schema
    await initializeDatabase();
    
    // Seed default subjects
    await seedDefaultSubjects();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 VidyaMark API Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Health check: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

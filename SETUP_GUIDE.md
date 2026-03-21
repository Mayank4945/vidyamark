# Scorecard Development Setup Guide

## Quick Start

### 1. Database Setup (PostgreSQL)

```bash
# Create database
createdb scorecard_db

# Apply schema
psql -U postgres -d scorecard_db -f database/schema.sql

# Verify tables were created
psql -U postgres -d scorecard_db -c "\dt"
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Important: Change JWT_SECRET to a secure value

# Install dependencies
npm install

# Run development server
npm run dev
```

Backend will be available at: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

### 3. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at: `http://localhost:3000`

## Project Structure

### Backend (`/backend`)
- `src/server.ts` - Express server entry point
- `src/database.ts` - PostgreSQL connection & query functions
- `src/middleware/` - Authentication, validation middleware
- `src/services/` - Business logic (StudentService, ExamService, MarksService, ExportService)
- `src/models/` - TypeScript interfaces
- `src/routes/` - API route handlers (to be created)
- `src/controllers/` - Request handlers (to be created)

### Frontend (`/frontend`)
- `src/components/` - Reusable components (StudentTable, StudentForm, ExamForm, etc.)
- `src/pages/` - Page components (Dashboard, StudentManagement, ExamManagement, etc.)
- `src/services/api.ts` - API client with all endpoints
- `src/utils/` - Helper functions and custom hooks
- `src/App.tsx` - Main app component with routing

### Database (`/database`)
- `schema.sql` - PostgreSQL DDL to create all tables and indexes

## Key Services Implemented

### StudentService (`backend/src/services/StudentService.ts`)
- `createStudent()` - Add new student
- `getStudentsByClass()` - Get all students in a class
- `getStudentsBySchool()` - Get all students in a school
- `getStudentById()` - Get student details
- `updateStudent()` - Update student info
- `deleteStudent()` - Soft delete student
- `bulkImportStudents()` - Import multiple students from Excel/CSV

### MarksService (`backend/src/services/MarksService.ts`)
- `upsertMarks()` - Add or update marks for a student
- `getMarksByExam()` - Get all marks for an exam
- `getStudentSubjectMarks()` - Get marks for a student in specific subject
- `calculateStudentSubjectGrade()` - Calculate grade for a subject
- `getAbsentStudents()` - Get absent students for an exam
- `markAbsent()` - Mark student as absent

### ExamService (`backend/src/services/ExamService.ts`)
- `createExam()` - Create a new exam
- `getExamsByClass()` - Get all exams for a class
- `getExamsBySubject()` - Get exams for a subject
- `getExamById()` - Get exam details
- `updateExam()` - Update exam info
- `deleteExam()` - Delete exam
- `getExamStatistics()` - Get pass/fail/average statistics

### ExportService (`backend/src/services/ExportService.ts`)
- `exportMarksToExcel()` - Export exam marks to Excel
- `exportMarksToCSV()` - Export exam marks to CSV
- `exportReportCardToPDF()` - Generate PDF report card for a student
- `exportClassPerformanceSummary()` - Export class performance to Excel

## API Endpoints (To Be Implemented)

### Authentication
- `POST /api/auth/register` - Register teacher/admin
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh authentication token

### Students
- `GET /api/students` - Get students by class
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk-import` - Bulk import students

### Exams
- `GET /api/exams` - Get exams by class
- `POST /api/exams` - Create exam
- `GET /api/exams/:id` - Get exam details
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `GET /api/exams/:id/statistics` - Get exam statistics

### Marks
- `GET /api/marks` - Get marks for an exam
- `POST /api/marks` - Add/update marks
- `GET /api/marks/student/:studentId/subject/:subjectId` - Get student marks
- `POST /api/marks/absent` - Mark student absent

### Reports & Export
- `GET /api/reports/report-card` - Get report card
- `POST /api/reports/generate` - Generate report card
- `GET /api/export/excel` - Export to Excel
- `GET /api/export/csv` - Export to CSV
- `GET /api/export/pdf-report` - Export PDF report card
- `GET /api/export/class-performance` - Export class summary

## Frontend Components (Created)

- `StudentTable` - Display list of students with edit/delete actions
- `StudentForm` - Form to add/edit student information
- Custom hooks (`useAPI`, `useAuth`, `useFormSubmit`) for common operations
- API client with interceptors for token management

## Frontend Components (To Be Created)

- `Dashboard` - Main dashboard with statistics and quick actions
- `StudentManagement` - Student CRUD operations page
- `ExamManagement` - Create and manage exams
- `MarkEntry` - Enter marks for exams
- `Reports` - View and generate reports
- `Login` - User authentication
- `NavigationLayout` - Sidebar and header navigation
- `MarkEntryForm` - Form to enter marks
- `ExamForm` - Form to create/edit exams
- `ExamTable` - Display exams with statistics
- `ReportCard` - Display student report card
- `Analytics` - Performance charts and analytics

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=scorecard_db
JWT_SECRET=change_this_to_random_string
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=Scorecard
REACT_APP_ENVIRONMENT=development
```

## Development Tips

1. **Database Queries**: Services use raw SQL. TypeORM can be added for more complex queries.

2. **Authentication**: JWT tokens stored in localStorage. Implement refresh token mechanism for production.

3. **Error Handling**: Consistent error responses from backend using status codes and messages.

4. **Validation**: Add input validation middleware on backend routes.

5. **Logging**: Implement Winston or similar logging for production.

## Next Steps

1. Create REST API routes and controllers
2. Implement authentication (login/register)
3. Create student management pages
4. Build exam creation and mark entry forms
5. Implement report generation and export
6. Add analytics dashboard
7. Create bulk import functionality
8. Add email notifications
9. Implement pagination and filtering
10. Add unit tests

## Troubleshooting

### Database connection error
- Check PostgreSQL is running: `psql --version`
- Verify database credentials in `.env`
- Ensure database exists: `psql -l`

### Port already in use
- Backend: `lsof -i :5000` then kill the process
- Frontend: `lsof -i :3000` then kill the process

### Module not found
- Run `npm install` in both frontend and backend
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

---

**Last Updated**: March 2026
**Status**: ✅ Initial project structure set up. Ready for API development.

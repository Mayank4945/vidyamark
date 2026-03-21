# 🚀 Getting Started - Development Guide

## Phase 1 Complete! ✅

You now have a **fully functional student management module** with:
- ✅ User authentication (Register/Login)
- ✅ Complete API (Students, Classes, Subjects, Exams, Marks)
- ✅ Professional single-page application with routing
- ✅ Student CRUD operations
- ✅ Dashboard with statistics

---

## Installation & Setup

### Step 1: Install PostgreSQL
- Download from https://www.postgresql.org/download/
- During installation, set password as **postgres** (or update `.env` file)
- Ensure PostgreSQL is running

### Step 2: Create Database and Apply Schema

```bash
# Open PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE scorecard_db;

# Exit psql
\q

# Apply schema
psql -U postgres -d scorecard_db -f database/schema.sql

# Verify tables
psql -U postgres -d scorecard_db -c "\dt"
```

### Step 3: Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Update .env if needed (database credentials)
# Important: Change JWT_SECRET to something secure for production

# Install dependencies
npm install

# Start development server
npm run dev
```

**Backend will run on**: `http://localhost:5000`

Test health: `curl http://localhost:5000/api/health`

### Step 4: Frontend Setup (New Terminal)

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm start
```

**Frontend will open**: `http://localhost:3000`

---

## Testing the Application

### 1. Register a New Teacher Account
1. Go to `http://localhost:3000`
2. Click "Register here"
3. Fill in details:
   - **First Name**: John
   - **Last Name**: Doe
   - **Email**: teacher@school.com
   - **Password**: Password123
   - **Confirm Password**: Password123
4. Click "Register"

### 2. Login with Your Account
- Email: teacher@school.com
- Password: Password123

### 3. Add Students (Without Classes First - Follow These Steps)

**First, Create a School & Class using Database:**

```bash
# Connect to database
psql -U postgres -d scorecard_db

# Create a school
INSERT INTO schools (name, address, principal) 
VALUES ('Sample School', '123 Main St', 'Principal Name')
RETURNING id;
# Note the returned ID (e.g., 1)

# Create a class
INSERT INTO classes (school_id, name, grade_level, teacher_id) 
VALUES (1, '10-A', 10, 1)
RETURNING id;
# Note the returned ID (e.g., 1)

# Exit
\q
```

Then in the app:
1. Go to "Students" menu
2. Select "10-A" from class dropdown
3. Click "+ Add Student"
4. Fill details:
   - Roll Number: 001
   - First Name: Aarav
   - Last Name: Singh
   - Email: aarav@example.com
   - Phone: 9876543210
   - Parent Name: Parent Name
   - Parent Contact: 9876543211
5. Click "Add Student"
6. Repeat to add more students

### 4. Create Exams

**First, Create Subjects:**

```bash
psql -U postgres -d scorecard_db

INSERT INTO subjects (school_id, name, code, description)
VALUES (1, 'Mathematics', 'MATH', 'Math subject'),
       (1, 'English', 'ENG', 'English subject'),
       (1, 'Science', 'SCI', 'Science subject');

\q
```

Then in the app:
1. Go to "Exams" menu
2. Select class "10-A"
3. Click "+ Add Exam"
4. Fill details:
   - Exam Name: Unit Test 1
   - Subject: Mathematics
   - Exam Type: Unit Test
   - Exam Date: Select any date
   - Max Marks: 100
   - Passing Marks: 40
5. Click "Create Exam"

### 5. Add Marks (Coming Soon)
- Navigate to "Marks" menu
- Select exam
- Enter marks for each student

### 6. View Reports (Coming Soon)
- Go to "Reports" menu
- Generate report cards and analytics

---

## API Endpoints Reference

### Authentication
```bash
# Register
POST /api/auth/register
Body: {
  "email": "teacher@school.com",
  "password": "password",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/auth/login
Body: {
  "email": "teacher@school.com",
  "password": "password"
}

# Get current user
GET /api/auth/me
Header: Authorization: Bearer {token}
```

### Students
```bash
# Get students by class
GET /api/students?classId=1
Header: Authorization: Bearer {token}

# Create student
POST /api/students
Header: Authorization: Bearer {token}
Body: {
  "classId": 1,
  "schoolId": 1,
  "rollNumber": "001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}

# Update student
PUT /api/students/{id}
Header: Authorization: Bearer {token}
Body: { /* updated fields */ }

# Delete student
DELETE /api/students/{id}
Header: Authorization: Bearer {token}
```

### Classes
```bash
# Get all classes
GET /api/classes?schoolId=1
Header: Authorization: Bearer {token}

# Create class
POST /api/classes
Header: Authorization: Bearer {token}
Body: {
  "schoolId": 1,
  "name": "10-A",
  "gradeLevel": 10,
  "teacherId": 1
}
```

### Subjects
```bash
# Get all subjects
GET /api/subjects?schoolId=1
Header: Authorization: Bearer {token}

# Create subject
POST /api/subjects
Header: Authorization: Bearer {token}
Body: {
  "schoolId": 1,
  "name": "Mathematics",
  "code": "MATH"
}
```

### Exams
```bash
# Get exams by class
GET /api/exams?classId=1
Header: Authorization: Bearer {token}

# Create exam
POST /api/exams
Header: Authorization: Bearer {token}
Body: {
  "classId": 1,
  "subjectId": 1,
  "examType": "unit_test",
  "examName": "Unit Test 1",
  "examDate": "2024-03-25",
  "maxMarks": 100
}
```

### Marks
```bash
# Get marks for exam
GET /api/marks?examId=1
Header: Authorization: Bearer {token}

# Add/Update marks
POST /api/marks
Header: Authorization: Bearer {token}
Body: {
  "examId": 1,
  "studentId": 1,
  "marksObtained": 85,
  "remarks": "Good performance"
}
```

---

## Testing with Postman/Thunder Client

1. **Install Postman** or **VS Code Thunder Client extension**
2. **Set up Authorization**:
   - Login first via frontend to get token
   - Copy token from response
   - In Postman, set Authorization type to "Bearer Token"
   - Paste the token

3. **Test Endpoints**:
   - Click on each endpoint above
   - Set method (GET/POST/PUT/DELETE)
   - Fill body if needed
   - Click Send

---

## Troubleshooting

### Port 5000 Already in Use (Backend)
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change PORT in .env
```

### Port 3000 Already in Use (Frontend)
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or start on different port
PORT=3001 npm start
```

### Database Connection Error
- Check PostgreSQL is running: `psql --version`
- Verify .env credentials match your PostgreSQL setup
- Check database exists: `psql -l`

### Module not found error
```bash
# Clear node_modules in both directories
rm -rf node_modules package-lock.json
npm install
```

### Token Expired
- Frontend will auto-redirect to login if token expires
- Just log in again

---

## Next Steps - Phase 2

Once you test and verify everything works, we'll build:

1. ✅ **Mark Entry System** - Interactive mark input form
2. ✅ **Grade Calculation Engine** - Automatic grade computation
3. ✅ **Export Functionality** - Excel/PDF/CSV downloads
4. ✅ **Report Cards** - Professional report generation
5. ✅ **Analytics Dashboard** - Performance visualizations
6. ✅ **Bulk Import** - Import students via Excel

---

## Project Structure Recap

```
Scorecard/
├── backend/
│   ├── src/
│   │   ├── controllers/   (StudentController, AuthController, etc.)
│   │   ├── routes/        (studentRoutes, authRoutes, etc.)
│   │   ├── services/      (StudentService, ExamService, MarksService)
│   │   ├── middleware/    (auth.ts - JWT verification)
│   │   ├── models/        (TypeScript interfaces)
│   │   ├── database.ts    (PostgreSQL connection)
│   │   └── server.ts      (Express server entry point)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/         (Login, Register, Dashboard, StudentManagement, etc.)
│   │   ├── components/    (StudentTable, StudentForm, NavigationLayout, etc.)
│   │   ├── services/      (api.ts - API client)
│   │   ├── utils/         (helpers.ts, hooks.ts)
│   │   ├── styles/        (CSS files)
│   │   ├── App.tsx        (Main app with routing)
│   │   └── index.tsx
│   ├── public/            (index.html)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── database/
    └── schema.sql         (PostgreSQL DDL)
```

---

**Status**: 🎉 Phase 1 Complete - Ready for Testing!

Go ahead and test everything. Let me know if you face any issues or want to proceed to Phase 2.

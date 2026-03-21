# ⚡ Quick Reference - Scorecard Commands & Endpoints

## 🚀 Quick Start Commands

```bash
# Setup Database
psql -U postgres
CREATE DATABASE scorecard_db;
\q
psql -U postgres -d scorecard_db -f database/schema.sql

# Start Backend (Terminal 1)
cd backend
npm install
npm run dev
# http://localhost:5000

# Start Frontend (Terminal 2)
cd frontend
npm install
npm start
# http://localhost:3000

# Check Health
curl http://localhost:5000/api/health
```

---

## 🔐 Authentication Endpoints

```bash
# Register
POST http://localhost:5000/api/auth/register
{
  "email": "teacher@school.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
Response: { token, user data }

# Login
POST http://localhost:5000/api/auth/login
{
  "email": "teacher@school.com",
  "password": "password123"
}
Response: { token, user data }

# Get Current User
GET http://localhost:5000/api/auth/me
Header: Authorization: Bearer {token}

# Change Password
POST http://localhost:5000/api/auth/change-password
Header: Authorization: Bearer {token}
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

---

## 👥 Student Management Endpoints

```bash
# Get Students by Class
GET http://localhost:5000/api/students?classId=1
Header: Authorization: Bearer {token}

# Get Students by School
GET http://localhost:5000/api/students/school/1
Header: Authorization: Bearer {token}

# Get Single Student
GET http://localhost:5000/api/students/1
Header: Authorization: Bearer {token}

# Create Student
POST http://localhost:5000/api/students
Header: Authorization: Bearer {token}
{
  "classId": 1,
  "schoolId": 1,
  "rollNumber": "001",
  "firstName": "Aarav",
  "lastName": "Singh",
  "email": "aarav@example.com",
  "phone": "9876543210",
  "parentName": "Parent Name",
  "parentContact": "9876543211"
}

# Update Student
PUT http://localhost:5000/api/students/1
Header: Authorization: Bearer {token}
{ /* fields to update */ }

# Delete Student
DELETE http://localhost:5000/api/students/1
Header: Authorization: Bearer {token}

# Bulk Import Students
POST http://localhost:5000/api/students/bulk-import
Header: Authorization: Bearer {token}
{
  "classId": 1,
  "schoolId": 1,
  "students": [
    { "rollNumber": "001", "firstName": "John", "lastName": "Doe" },
    { "rollNumber": "002", "firstName": "Jane", "lastName": "Doe" }
  ]
}
```

---

## 📚 Class Endpoints

```bash
# Get All Classes
GET http://localhost:5000/api/classes?schoolId=1
Header: Authorization: Bearer {token}

# Get Class by ID
GET http://localhost:5000/api/classes/1
Header: Authorization: Bearer {token}

# Create Class
POST http://localhost:5000/api/classes
Header: Authorization: Bearer {token}
{
  "schoolId": 1,
  "name": "10-A",
  "gradeLevel": 10,
  "teacherId": 1
}

# Update Class
PUT http://localhost:5000/api/classes/1
Header: Authorization: Bearer {token}
{ /* fields to update */ }

# Delete Class
DELETE http://localhost:5000/api/classes/1
Header: Authorization: Bearer {token}
```

---

## 📖 Subject Endpoints

```bash
# Get All Subjects
GET http://localhost:5000/api/subjects?schoolId=1
Header: Authorization: Bearer {token}

# Create Subject
POST http://localhost:5000/api/subjects
Header: Authorization: Bearer {token}
{
  "schoolId": 1,
  "name": "Mathematics",
  "code": "MATH",
  "description": "Math subject"
}

# Update Subject
PUT http://localhost:5000/api/subjects/1
Header: Authorization: Bearer {token}
{ /* fields to update */ }
```

---

## 📝 Exam Endpoints

```bash
# Get Exams by Class
GET http://localhost:5000/api/exams?classId=1
Header: Authorization: Bearer {token}

# Get Exams by Subject
GET http://localhost:5000/api/exams/subject?classId=1&subjectId=1
Header: Authorization: Bearer {token}

# Get Exam by ID
GET http://localhost:5000/api/exams/1
Header: Authorization: Bearer {token}

# Create Exam
POST http://localhost:5000/api/exams
Header: Authorization: Bearer {token}
{
  "classId": 1,
  "subjectId": 1,
  "examType": "unit_test",
  "examName": "Unit Test 1",
  "examDate": "2024-03-25",
  "maxMarks": 100,
  "passingMarks": 40,
  "weightage": 100
}

# Get Exam Statistics
GET http://localhost:5000/api/exams/1/statistics
Header: Authorization: Bearer {token}
Response: { totalStudents, absent, average, highest, lowest, passPercentage }

# Update Exam
PUT http://localhost:5000/api/exams/1
Header: Authorization: Bearer {token}

# Delete Exam
DELETE http://localhost:5000/api/exams/1
Header: Authorization: Bearer {token}
```

---

## ✏️ Marks Endpoints

```bash
# Get Marks for Exam
GET http://localhost:5000/api/marks?examId=1
Header: Authorization: Bearer {token}

# Get Student's Marks in Subject
GET http://localhost:5000/api/marks/student/1/subject/1
Header: Authorization: Bearer {token}

# Add/Update Marks
POST http://localhost:5000/api/marks
Header: Authorization: Bearer {token}
{
  "examId": 1,
  "studentId": 1,
  "marksObtained": 85,
  "remarks": "Good performance"
}

# Mark Student Absent
POST http://localhost:5000/api/marks/absent
Header: Authorization: Bearer {token}
{
  "examId": 1,
  "studentId": 1
}

# Calculate Grades
POST http://localhost:5000/api/marks/calculate-grades
Header: Authorization: Bearer {token}
{
  "studentId": 1,
  "classId": 1,
  "subjectId": 1,
  "semester": "1st Semester",
  "academicYear": "2024-2025"
}

# Get Absent Students
GET http://localhost:5000/api/marks/absent?examId=1
Header: Authorization: Bearer {token}
```

---

## 🌐 Frontend Pages

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/login` | Login page |
| `http://localhost:3000/register` | Register page |
| `http://localhost:3000/dashboard` | Main dashboard |
| `http://localhost:3000/students` | Student management |
| `http://localhost:3000/exams` | Exam management |
| `http://localhost:3000/marks` | Mark entry (coming soon) |
| `http://localhost:3000/reports` | Reports & analytics (coming soon) |
| `http://localhost:3000/settings` | Settings (coming soon) |

---

## 📊 Exam Types

```
unit_test  - Unit Test
mid_term   - Mid-term Exam
final_term - Final Term Exam
assignment - Assignment/Project
```

---

## 🗄️ Sample Database Setup

```sql
-- Create School
INSERT INTO schools (name, address, principal) 
VALUES ('Sample School', '123 Main St', 'Principal Name');

-- Create Class
INSERT INTO classes (school_id, name, grade_level, teacher_id)
VALUES (1, '10-A', 10, 1);

-- Create Subjects
INSERT INTO subjects (school_id, name, code)
VALUES 
  (1, 'Mathematics', 'MATH'),
  (1, 'English', 'ENG'),
  (1, 'Science', 'SCI');

-- Create Grade Configuration
INSERT INTO grade_configurations (school_id, grade_name, min_percentage, max_percentage, grade_point)
VALUES 
  (1, 'A+', 90, 100, 4.0),
  (1, 'A', 80, 89, 3.7),
  (1, 'B+', 70, 79, 3.3),
  (1, 'B', 60, 69, 3.0),
  (1, 'C+', 50, 59, 2.3),
  (1, 'C', 40, 49, 2.0),
  (1, 'F', 0, 39, 0.0);
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `lsof -i :5000` then `kill -9 <PID>` |
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| DB connection error | Check PostgreSQL running & credentials in .env |
| Module not found | `rm -rf node_modules && npm install` |
| Token expired | Log in again from login page |
| 401 Unauthorized | Missing/invalid token in header |

---

## 📱 HTTP Status Codes Used

```
200 - OK (Success)
201 - Created (Resource created)
400 - Bad Request (Invalid input)
401 - Unauthorized (No token/invalid token)
403 - Forbidden (No permission)
404 - Not Found (Resource doesn't exist)
409 - Conflict (Duplicate entry)
500 - Server Error
```

---

## 🔑 Important Files

```
Backend Setup:
- backend/.env.example          - Environment variables template
- backend/src/server.ts         - Express server entry point
- database/schema.sql           - Database DDL

Frontend Setup:
- frontend/.env.example         - Frontend env vars
- frontend/src/App.tsx          - Main app with routes
- frontend/src/services/api.ts  - API client

Documentation:
- GETTING_STARTED.md            - Detailed setup guide
- PHASE_1_SUMMARY.md            - What was built
- README.md                     - Project overview
- SETUP_GUIDE.md               - Installation guide
```

---

## ✅ Testing Checklist

- [ ] Database created and schema applied
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can register a new account
- [ ] Can login with registered account
- [ ] Can view dashboard
- [ ] Can add a student
- [ ] Can edit a student
- [ ] Can delete a student
- [ ] Can create an exam
- [ ] Can see exam list

---

**Need help?** Check [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed instructions!

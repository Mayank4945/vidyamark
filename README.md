# 🎓 VidyaMark - Professional Student Data & Exam Marks Management System

A comprehensive web application designed for schools to manage student data, exam marks, and generate detailed reports effortlessly. *VidyaMark = Vidya (Knowledge) + Mark (Grades)*

## 🚀 Features

### Core Features
- **Student Management**: Complete student profiles with contact information and parent details
- **Multi-Exam Support**: Support for various exam types (unit tests, mid-term, final, assignments)
- **Automatic Grade Calculation**: Intelligent grading system with configurable grade scales
- **Export Functionality**: 
  - Excel (.xlsx) - For data manipulation and analysis
  - CSV (.csv) - For data portability
  - PDF Report Cards - Professional report generation
- **Analytics Dashboard**: Visualize student performance trends
- **User Management**: Role-based access (Admin, Teacher, Principal)
- **Class & Subject Management**: Organize students by classes and subjects

## 📋 Project Structure

```
VidyaMark/
├── frontend/              # React.js TypeScript Frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API calls
│   │   ├── utils/        # Helper functions
│   │   └── App.tsx       # Main app component
│   └── package.json
│
├── backend/              # Node.js Express Backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Business logic
│   │   ├── models/       # Database models
│   │   ├── middleware/   # Auth, validation
│   │   ├── services/     # Business services
│   │   ├── utils/        # Helper functions
│   │   └── server.ts     # Express server
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── database/             # Database setup
    ├── schema.sql        # PostgreSQL schema
    └── migrations/       # Database migrations (future)
```

## 🔧 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Ant Design** - UI Component library
- **Axios** - HTTP client
- **React Router** - Navigation
- **Recharts** - Data visualization
- **ExcelJS/XLSX** - Excel export

### Backend
- **Node.js/Express** - Server framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **TypeORM** - ORM
- **JWT** - Authentication
- **ExcelJS/PDFKit** - Report generation

## 📦 Getting Started

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Installation

#### 1. Clone and Setup Database
```bash
# Create PostgreSQL database
createdb scorecard_db

# Apply schema
psql -U postgres -d scorecard_db -f database/schema.sql
```

#### 2. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`

## 🔑 Default Grade Scale

| Grade | Percentage Range | Grade Point |
|-------|------------------|-------------|
| A+    | 90-100%          | 4.0         |
| A     | 80-89%           | 3.7         |
| B+    | 70-79%           | 3.3         |
| B     | 60-69%           | 3.0         |
| C+    | 50-59%           | 2.3         |
| C     | 40-49%           | 2.0         |
| F     | Below 40%        | 0.0         |

## 📝 API Routes (To be implemented)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Exams & Marks
- `GET /api/exams` - Get all exams
- `POST /api/exams` - Create exam
- `POST /api/marks` - Add/Update marks
- `GET /api/marks/:examId` - Get marks for exam

### Reports & Export
- `GET /api/reports/report-card/:studentId` - Generate report card
- `POST /api/export/excel` - Export to Excel
- `POST /api/export/pdf` - Export to PDF
- `POST /api/export/csv` - Export to CSV

## 🎯 Development Roadmap

### Phase 1 (Current) ✓
- [x] Project setup & structure
- [x] Database schema design
- [ ] Backend API development
- [ ] Frontend UI components

### Phase 2
- [ ] Authentication & Authorization
- [ ] Student & Exam management
- [ ] Mark entry system

### Phase 3
- [ ] Grade calculation engine
- [ ] Export functionality
- [ ] Report generation

### Phase 4
- [ ] Analytics dashboard
- [ ] Performance tracking
- [ ] User notifications

### Phase 5
- [ ] Mobile responsive design
- [ ] Bulk import (Excel/CSV)
- [ ] Advanced filtering & search

## 💡 Future Enhancements

- **Attendance Integration**: Track student attendance
- **Parent Portal**: Allow parents to view student progress
- **SMS/Email Notifications**: Notify parents automatically
- **Comparative Analysis**: Compare student/class performance
- **Mobile App**: Native mobile application
- **Cloud Deployment**: Cloud-based hosting options
- **API Documentation**: OpenAPI/Swagger documentation
- **Advanced Role Management**: Custom permission levels

## 🔒 Security Features

- JWT Authentication
- Password Hashing (bcryptjs)
- CORS Protection
- Input Validation
- SQL Injection Prevention (TypeORM)
- Role-based Access Control

## 📞 Support & Feedback

This is a collaborative development project. Feel free to suggest improvements and provide feedback throughout the development process!

---

**Status**: 🚧 In Development - Ready to start building!

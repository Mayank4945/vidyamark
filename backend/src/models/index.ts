// Database Models/Interfaces

export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'principal';
  schoolId?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface School {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  principal?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  id: number;
  schoolId: number;
  name: string;
  gradeLevel: number;
  teacherId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: number;
  classId: number;
  schoolId: number;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  parentName?: string;
  parentContact?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: number;
  schoolId: number;
  name: string;
  code?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Exam {
  id: number;
  classId: number;
  subjectId: number;
  examType: 'unit_test' | 'mid_term' | 'final_term' | 'assignment';
  examName: string;
  examDate: Date;
  maxMarks: number;
  weightage: number;
  passingMarks?: number;
  description?: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Marks {
  id: number;
  examId: number;
  studentId: number;
  marksObtained: number;
  remarks?: string;
  isAbsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeConfiguration {
  id: number;
  schoolId: number;
  gradeName: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassPerformance {
  id: number;
  classId: number;
  studentId: number;
  subjectId: number;
  totalMarksObtained: number;
  totalMarksPossible: number;
  percentage: number;
  grade: string;
  remarks?: string;
  semester: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportCard {
  id: number;
  studentId: number;
  classId: number;
  semester: string;
  academicYear: string;
  totalPercentage: number;
  rankInClass?: number;
  principalRemarks?: string;
  generatedBy: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Response DTOs
export interface StudentDTO {
  id: number;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentContact?: string;
}

export interface ExamDTO {
  id: number;
  examName: string;
  examType: string;
  examDate: Date;
  maxMarks: number;
  subjectName?: string;
  className?: string;
}

export interface MarksDTO {
  studentId: number;
  studentName: string;
  marksObtained: number;
  percentage: number;
  grade?: string;
  isAbsent: boolean;
  remarks?: string;
}

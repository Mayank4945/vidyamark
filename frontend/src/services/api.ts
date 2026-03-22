import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token expiration
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic post method
  post(endpoint: string, data: any) {
    return this.client.post(endpoint, data);
  }

  // Generic get method
  get(endpoint: string) {
    return this.client.get(endpoint);
  }

  // Auth endpoints
  login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  // Student endpoints
  getStudents(classId: number) {
    return this.client.get(`/students?classId=${classId}`);
  }

  getStudentById(studentId: number) {
    return this.client.get(`/students/${studentId}`);
  }

  createStudent(data: any) {
    return this.client.post('/students', data);
  }

  updateStudent(studentId: number, data: any) {
    return this.client.put(`/students/${studentId}`, data);
  }

  deleteStudent(studentId: number) {
    return this.client.delete(`/students/${studentId}`);
  }

  bulkImportStudents(classId: number, students: any[]) {
    return this.client.post('/students/bulk-import', { classId, students });
  }

  // Exam endpoints
  getExams(classId: number) {
    return this.client.get(`/exams?classId=${classId}`);
  }

  getExamById(examId: number) {
    return this.client.get(`/exams/${examId}`);
  }

  createExam(data: any) {
    return this.client.post('/exams', data);
  }

  updateExam(examId: number, data: any) {
    return this.client.put(`/exams/${examId}`, data);
  }

  deleteExam(examId: number) {
    return this.client.delete(`/exams/${examId}`);
  }

  // Marks endpoints
  getMarks(examId: number) {
    return this.client.get(`/marks?examId=${examId}`);
  }

  updateMarks(examId: number, studentId: number, marksObtained: number, remarks?: string) {
    return this.client.post('/marks', { examId, studentId, marksObtained, remarks });
  }

  getStudentSubjectMarks(studentId: number, subjectId: number) {
    return this.client.get(`/marks/student/${studentId}/subject/${subjectId}`);
  }

  // Export endpoints
  exportMarksExcel(examId: number) {
    return this.client.get(`/export/excel?examId=${examId}`, { responseType: 'blob' });
  }

  exportMarksCSV(examId: number) {
    return this.client.get(`/export/csv?examId=${examId}`, { responseType: 'blob' });
  }

  exportReportCardPDF(studentId: number, classId: number, semester: string) {
    return this.client.get(`/export/pdf-report?studentId=${studentId}&classId=${classId}&semester=${semester}`, {
      responseType: 'blob',
    });
  }

  exportClassPerformance(classId: number, semester: string) {
    return this.client.get(`/export/class-performance?classId=${classId}&semester=${semester}`, {
      responseType: 'blob',
    });
  }

  // Reports endpoints
  getReportCard(studentId: number, classId: number, semester: string) {
    return this.client.get(`/reports/report-card?studentId=${studentId}&classId=${classId}&semester=${semester}`);
  }

  generateReportCard(studentId: number, classId: number, semester: string) {
    return this.client.post(`/reports/generate`, { studentId, classId, semester });
  }

  // Class endpoints
  getClasses() {
    return this.client.get('/classes');
  }

  getClassById(classId: number) {
    return this.client.get(`/classes/${classId}`);
  }

  createClass(data: any) {
    return this.client.post('/classes', data);
  }

  updateClass(classId: number, data: any) {
    return this.client.put(`/classes/${classId}`, data);
  }

  deleteClass(classId: number) {
    return this.client.delete(`/classes/${classId}`);
  }

  // School endpoints
  getSchools() {
    return this.client.get('/schools');
  }

  getSchoolById(schoolId: number) {
    return this.client.get(`/schools/${schoolId}`);
  }

  createSchool(data: any) {
    return this.client.post('/schools', data);
  }

  updateSchool(schoolId: number, data: any) {
    return this.client.put(`/schools/${schoolId}`, data);
  }

  deleteSchool(schoolId: number) {
    return this.client.delete(`/schools/${schoolId}`);
  }

  // Subject endpoints
  getSubjects() {
    return this.client.get(`/subjects`);
  }

  createSubject(data: any) {
    return this.client.post('/subjects', data);
  }

  updateSubject(subjectId: number, data: any) {
    return this.client.put(`/subjects/${subjectId}`, data);
  }

  deleteSubject(subjectId: number) {
    return this.client.delete(`/subjects/${subjectId}`);
  }

  // User Request Endpoints (Registration Requests)
  getUserRequests() {
    return this.client.get('/user-requests');
  }

  approveUserRequest(requestId: number, rejectionReason?: string) {
    return this.client.post('/user-requests', {
      requestId,
      action: 'approve',
      rejectionReason
    });
  }

  rejectUserRequest(requestId: number, rejectionReason: string) {
    return this.client.post('/user-requests', {
      requestId,
      action: 'reject',
      rejectionReason
    });
  }

  // User Management Endpoints
  getUsers(schoolId?: number, role?: string) {
    let url = '/users';
    const params = [];
    if (schoolId) params.push(`schoolId=${schoolId}`);
    if (role) params.push(`role=${role}`);
    if (params.length > 0) url += '?' + params.join('&');
    return this.client.get(url);
  }

  createUser(data: any) {
    return this.client.post('/users', data);
  }

  updateUser(userId: number, data: any) {
    return this.client.put(`/users/${userId}`, data);
  }

  deleteUser(userId: number) {
    return this.client.delete('/users', {
      data: { id: userId }
    });
  }
}

export default new APIClient();

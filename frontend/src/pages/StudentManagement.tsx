import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  message,
  Select,
  Row,
  Col,
  Modal,
  Spin,
  Empty,
  Form,
  Input,
  InputNumber
} from 'antd';
import { PlusOutlined, FileExcelOutlined, ImportOutlined } from '@ant-design/icons';
import StudentTable from '../components/StudentTable';
import StudentForm from '../components/StudentForm';
import api from '../services/api';

const StudentManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [createClassModalVisible, setCreateClassModalVisible] = useState(false);
  const [createClassForm] = Form.useForm();
  const [createClassLoading, setCreateClassLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.getClasses();
      const classesData = response.data.data || [];
      setClasses(classesData);
      
      if (classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      } else {
        setSelectedClass(null);
      }
    } catch (error: any) {
      message.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: number) => {
    try {
      setLoading(true);
      console.log('Fetching students for classId:', classId);
      const response = await api.getStudents(classId);
      console.log('API Response:', response.data);
      const rawStudents = response.data.data || [];
      
      // Transform snake_case from database to camelCase for frontend
      const studentsData = rawStudents.map((student: any) => ({
        id: student.id,
        rollNumber: student.roll_number,
        firstName: student.first_name,
        lastName: student.last_name,
        fullName: `${student.first_name} ${student.last_name}`,
        email: student.email,
        phone: student.phone,
        dateOfBirth: student.date_of_birth,
        gender: student.gender,
        parentName: student.parent_name,
        parentContact: student.parent_contact
      }));
      
      console.log('Transformed Students data:', studentsData);
      setStudents(studentsData);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      message.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormVisible(true);
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setFormVisible(true);
  };

  const handleDeleteStudent = async (studentId: number) => {
    try {
      setLoading(true);
      await api.deleteStudent(studentId);
      message.success('Student deleted successfully');
      if (selectedClass) {
        fetchStudents(selectedClass);
      }
    } catch (error: any) {
      message.error('Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      
      if (!selectedClass) {
        message.error('Please select a class');
        return;
      }
      
      if (editingStudent) {
        // Update student
        const updateData = {
          id: editingStudent.id,
          rollNumber: data.rollNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth || null,
          gender: data.gender || null,
          parentName: data.parentName || null,
          parentContact: data.parentContact || null
        };
        await api.updateStudent(editingStudent.id, updateData);
        message.success('Student updated successfully');
      } else {
        // Create student (don't include schoolId as it's determined by JWT token)
        const createData = {
          classId: selectedClass,
          rollNumber: data.rollNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth || null,
          gender: data.gender || null,
          parentName: data.parentName || null,
          parentContact: data.parentContact || null
        };
        console.log('Creating student with data:', createData);
        await api.createStudent(createData);
        message.success('Student added successfully');
      }

      setFormVisible(false);
      
      // Refresh students list with a slight delay to ensure database is updated
      setTimeout(() => {
        if (selectedClass) {
          console.log('Fetching students for class:', selectedClass);
          fetchStudents(selectedClass);
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Operation failed';
      message.error(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      // Implementation for Excel export
      message.info('Excel export feature coming soon!');
    } catch (error) {
      message.error('Failed to download Excel');
    }
  };

  const handleCreateClass = async (values: any) => {
    try {
      setCreateClassLoading(true);
      
      // Create class (schoolId is determined by JWT token)
      await api.createClass({
        name: values.className,
        gradeLevel: values.gradeLevel
      });
      
      message.success('Class created successfully!');
      setCreateClassModalVisible(false);
      createClassForm.resetFields();
      
      // Refresh classes
      await fetchClasses();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to create class';
      message.error(errorMsg);
    } finally {
      setCreateClassLoading(false);
    }
  };

  return (
    <div>
      <Card
        title="Student Management"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddStudent}
            >
              Add Student
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleDownloadExcel}>
              Export Excel
            </Button>
            <Button icon={<ImportOutlined />}>
              Bulk Import
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Select Class
            </label>
            {classes.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: '#fff7e6', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 12px 0', color: '#d46b08', fontSize: '12px' }}>
                  <strong>No classes found.</strong> Create one below.
                </p>
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => setCreateClassModalVisible(true)}
                >
                  Create Class
                </Button>
              </div>
            ) : (
              <Select
                value={selectedClass}
                onChange={setSelectedClass}
                style={{ width: '100%' }}
                placeholder="Choose a class"
                options={classes.map(cls => ({
                  label: `${cls.name} (Grade ${cls.grade_level})`,
                  value: cls.id
                }))}
                loading={loading}
              />
            )}
          </Col>
        </Row>

        <Spin spinning={loading}>
          {students.length > 0 ? (
            <StudentTable
              students={students}
              loading={loading}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
              onDownload={handleDownloadExcel}
            />
          ) : (
            <Empty
              description="No students found"
              style={{ marginTop: '50px' }}
            >
              <Button type="primary" onClick={handleAddStudent}>
                Add Student
              </Button>
            </Empty>
          )}
        </Spin>
      </Card>

      <StudentForm
        visible={formVisible}
        loading={formLoading}
        initialData={editingStudent}
        onSubmit={handleFormSubmit}
        onCancel={() => setFormVisible(false)}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
      />

      <Modal
        title="Create New Class"
        open={createClassModalVisible}
        onCancel={() => {
          setCreateClassModalVisible(false);
          createClassForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={createClassForm}
          layout="vertical"
          onFinish={handleCreateClass}
        >
          <Form.Item
            label="Class Name"
            name="className"
            rules={[{ required: true, message: 'Please enter class name' }]}
          >
            <Input placeholder="e.g., 10-A" />
          </Form.Item>

          <Form.Item
            label="Grade Level"
            name="gradeLevel"
            rules={[{ required: true, message: 'Please enter grade level' }]}
          >
            <InputNumber min={1} max={12} placeholder="1-12" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={createClassLoading}
              block
            >
              Create Class
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentManagement;

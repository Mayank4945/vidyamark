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
import { PlusOutlined, FileExcelOutlined, ImportOutlined, DeleteOutlined } from '@ant-design/icons';
import StudentTable from '../components/StudentTable';
import StudentForm from '../components/StudentForm';
import api from '../services/api';

const StudentManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [setupForm] = Form.useForm();
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchClasses();
    }
  }, [selectedSchool]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchSchools = async () => {
    try {
      const response = await api.getSchools();
      const schoolsData = response.data.data || [];
      setSchools(schoolsData);
      
      if (schoolsData.length > 0) {
        setSelectedSchool(schoolsData[0].id);
      }
    } catch (error: any) {
      message.error('Failed to load schools');
    }
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      if (!selectedSchool) return;
      
      const response = await api.getClasses(selectedSchool);
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
      
      if (!selectedClass || !selectedSchool) {
        message.error('Please select both school and class');
        return;
      }
      
      if (editingStudent) {
        // Update student
        const updateData = {
          schoolId: selectedSchool,
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
        await api.updateStudent(editingStudent.id, updateData);
        message.success('Student updated successfully');
      } else {
        // Create student
        const createData = {
          schoolId: selectedSchool,
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

  const handleDeleteSchool = async (schoolId: number, schoolName: string) => {
    Modal.confirm({
      title: 'Delete School',
      content: `Are you sure you want to delete "${schoolName}"? This will also delete all related classes and students.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await api.deleteSchool(schoolId);
          message.success('School deleted successfully');
          
          // Refresh schools
          await fetchSchools();
          
          // If deleted school was selected, select first available school
          if (selectedSchool === schoolId) {
            const remaining = schools.filter(s => s.id !== schoolId);
            if (remaining.length > 0) {
              setSelectedSchool(remaining[0].id);
            } else {
              setSelectedSchool(null);
              setClasses([]);
            }
          }
        } catch (error: any) {
          message.error('Failed to delete school');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSetupSchoolAndClass = async (values: any) => {
    try {
      setSetupLoading(true);
      
      let schoolId = selectedSchool;
      
      // Only create school if schoolName is provided
      if (values.schoolName) {
        const schoolRes = await api.createSchool({
          name: values.schoolName,
          address: 'To be updated',
          phone: values.schoolPhone || ''
        });
        schoolId = schoolRes.data.data?.id;
        await fetchSchools();
      }

      if (!schoolId) {
        message.error('Please select a school or provide a new school name');
        return;
      }

      // Create class
      const classRes = await api.createClass({
        schoolId: schoolId,
        name: values.className,
        gradeLevel: values.gradeLevel
      });
      
      message.success('Class created successfully!');
      setSetupModalVisible(false);
      setupForm.resetFields();
      
      // Refresh classes
      setSelectedSchool(schoolId);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to create class';
      message.error(errorMsg);
    } finally {
      setSetupLoading(false);
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
              Select School {schools.length > 1 && <span style={{ color: '#ff4d4f', fontSize: '12px' }}>({schools.length} total)</span>}
            </label>
            {schools.length === 0 ? (
              <div style={{ padding: '12px', backgroundColor: '#fff7e6', borderRadius: '4px' }}>
                <p style={{ margin: '0', color: '#d46b08', fontSize: '12px' }}>
                  No schools found. Create one using the add class button.
                </p>
              </div>
            ) : (
              <div style={{ border: '1px solid #d9d9d9', borderRadius: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                {schools.map(school => (
                  <div
                    key={school.id}
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: selectedSchool === school.id ? '#e6f7ff' : 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedSchool(school.id)}
                  >
                    <span style={{ flex: 1 }}>{school.name}</span>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSchool(school.id, school.name);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </Col>
          
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
                  onClick={() => setSetupModalVisible(true)}
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
        title="Add New Class"
        open={setupModalVisible}
        onCancel={() => {
          setSetupModalVisible(false);
          setupForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={setupForm}
          layout="vertical"
          onFinish={handleSetupSchoolAndClass}
        >
          <Form.Item
            label="School"
            > 
            <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              {selectedSchool && schools.find(s => s.id === selectedSchool)?.name || 'No school selected'}
            </div>
          </Form.Item>

          <Form.Item
            label="Or Create New School (Optional)"
            name="schoolName"
          >
            <Input placeholder="e.g., ABC High School" />
          </Form.Item>

          <Form.Item
            label="School Phone (Optional)"
            name="schoolPhone"
          >
            <Input placeholder="+1234567890" />
          </Form.Item>

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
              loading={setupLoading}
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

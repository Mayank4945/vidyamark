import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  message,
  Select,
  Row,
  Col,
  Table,
  Spin,
  Form,
  InputNumber,
  Modal,
  Steps,
  Empty,
  Divider,
  Tag,
  Input
} from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const MarkEntry: React.FC = () => {
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0: Select Exam, 1: Select Class, 2: Enter Marks
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [marks, setMarks] = useState<{ [studentId: number]: number }>({});
  const [remarks, setRemarks] = useState<{ [studentId: number]: string }>({});
  const [form] = Form.useForm();

  useEffect(() => {
    fetchExams();
    fetchSubjects();
    fetchClasses();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.getExams();
      setExams(response.data?.data || response.data || []);
    } catch (error) {
      message.error('Failed to load exams');
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.getSubjects();
      setSubjects(response.data?.data || response.data || []);
    } catch (error) {
      message.error('Failed to load subjects');
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data?.data || response.data || []);
    } catch (error) {
      message.error('Failed to load classes');
    }
  };

  const handleSelectExam = (examId: number) => {
    const exam = exams.find((e) => e.id === examId);
    setSelectedExam(exam);
    setStep(1);
    setSelectedClass(null);
    setStudents([]);
    setMarks({});
    setRemarks({});
  };

  const handleSelectClass = async (classId: number) => {
    try {
      setLoading(true);
      setSelectedClass(classId);
      const response = await api.getStudents(classId);
      const studentList = response.data?.data || response.data || [];
      
      const transformedStudents = studentList.map((s: any) => ({
        id: s.id,
        rollNumber: s.roll_number,
        firstName: s.first_name,
        lastName: s.last_name,
        fullName: `${s.first_name} ${s.last_name}`
      }));
      
      setStudents(transformedStudents);
      setStep(2);
    } catch (error: any) {
      message.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId: number, mark: number | null) => {
    if (mark !== null) {
      setMarks((prev) => ({
        ...prev,
        [studentId]: mark
      }));
    } else {
      setMarks((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        return updated;
      });
    }
  };

  const handleRemarkChange = (studentId: number, remark: string) => {
    setRemarks((prev) => ({
      ...prev,
      [studentId]: remark
    }));
  };

  const handleSaveMarks = async () => {
    try {
      setLoading(true);
      const marksData = students.map((student) => ({
        examId: selectedExam.id,
        studentId: student.id,
        marks: marks[student.id] || 0,
        remarks: remarks[student.id] || ''
      }));

      // Filter to only include marks that have been entered
      const marksToSave = marksData.filter((m) => m.marks > 0 || m.remarks);

      if (marksToSave.length === 0) {
        message.warning('Please enter marks for at least one student');
        return;
      }

      // Save marks one by one (or batch if API supports)
      for (const markData of marksToSave) {
        await api.updateMarks(
          markData.examId,
          markData.studentId,
          markData.marks,
          markData.remarks
        );
      }

      message.success(`Marks saved successfully for ${marksToSave.length} student(s)`);
      
      // Reset
      setStep(0);
      setSelectedExam(null);
      setSelectedClass(null);
      setStudents([]);
      setMarks({});
      setRemarks({});
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectName = (subjectId: number) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject?.name || 'Unknown';
  };

  const getClassName = (classId: number) => {
    const cls = classes.find((c) => c.id === classId);
    return cls?.name || 'Unknown';
  };

  const marksTableColumns = [
    {
      title: 'Roll No',
      dataIndex: 'rollNumber',
      key: 'rollNumber',
      width: '80px'
    },
    {
      title: 'Student Name',
      dataIndex: 'fullName',
      key: 'fullName',
      width: '200px',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: `Marks (${selectedExam?.max_marks || 100})`,
      key: 'marks',
      width: '120px',
      render: (_: any, record: any) => (
        <InputNumber
          min={0}
          max={selectedExam?.max_marks || 100}
          value={marks[record.id] || undefined}
          onChange={(value) => handleMarkChange(record.id, value)}
          style={{ width: '100%' }}
          placeholder="Enter marks"
        />
      )
    },
    {
      title: 'Remarks',
      key: 'remarks',
      width: '150px',
      render: (_: any, record: any) => (
        <Input
          size="small"
          value={remarks[record.id] || ''}
          onChange={(e) => handleRemarkChange(record.id, e.target.value)}
          placeholder="Optional remarks"
        />
      )
    }
  ];

  if (step === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Card
          title="Mark Entry - Select Exam"
          extra={
            <Tag color="blue">Step 1 of 3</Tag>
          }
        >
          <Divider />
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              <p style={{ fontSize: '16px', marginBottom: '16px' }}>
                Select an exam to enter marks:
              </p>
              <Select
                placeholder="Choose an exam"
                style={{ width: '100%' }}
                onChange={handleSelectExam}
                options={exams.map((exam) => ({
                  label: `${exam.exam_name} - ${getSubjectName(exam.subject_id)} (${exam.exam_type})`,
                  value: exam.id,
                  exam: exam
                }))}
              />
            </Col>
          </Row>

          {exams.length === 0 && (
            <Empty description="No exams available. Please create exams first." />
          )}
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div style={{ padding: '24px' }}>
        <Card
          title="Mark Entry - Select Class"
          extra={
            <Tag color="blue">Step 2 of 3</Tag>
          }
        >
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              <Button
                type="text"
                onClick={() => {
                  setStep(0);
                  setSelectedExam(null);
                }}
              >
                ← Back to Exam Selection
              </Button>
            </Col>
          </Row>

          <Divider />

          <Card
            type="inner"
            style={{ marginBottom: '24px' }}
            title={
              <>
                <strong>Selected Exam:</strong> {selectedExam?.exam_name}
              </>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <p><strong>Subject:</strong> {getSubjectName(selectedExam?.subject_id)}</p>
              </Col>
              <Col span={12}>
                <p><strong>Type:</strong> {selectedExam?.exam_type}</p>
              </Col>
              <Col span={12}>
                <p><strong>Date:</strong> {dayjs(selectedExam?.exam_date).format('DD/MM/YYYY')}</p>
              </Col>
              <Col span={12}>
                <p><strong>Max Marks:</strong> {selectedExam?.max_marks}</p>
              </Col>
            </Row>
          </Card>

          <p style={{ fontSize: '16px', marginBottom: '16px' }}>
            Select a class to enter marks:
          </p>
          <Select
            placeholder="Choose a class"
            style={{ width: '100%' }}
            onChange={handleSelectClass}
            loading={loading}
            options={classes.map((cls) => ({
              label: cls.name,
              value: cls.id
            }))}
          />
        </Card>
      </div>
    );
  }

  // Step 2: Enter Marks
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Mark Entry - Enter Marks"
        extra={
          <Tag color="blue">Step 3 of 3</Tag>
        }
      >
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col>
            <Button
              type="text"
              onClick={() => {
                setStep(1);
                setSelectedClass(null);
                setStudents([]);
                setMarks({});
                setRemarks({});
              }}
            >
              ← Back to Class Selection
            </Button>
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card type="inner" size="small">
              <p style={{ margin: 0 }}>
                <strong>Exam:</strong> {selectedExam?.exam_name}
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card type="inner" size="small">
              <p style={{ margin: 0 }}>
                <strong>Subject:</strong> {getSubjectName(selectedExam?.subject_id)}
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card type="inner" size="small">
              <p style={{ margin: 0 }}>
                <strong>Class:</strong> {getClassName(selectedClass!)}
              </p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card type="inner" size="small">
              <p style={{ margin: 0 }}>
                <strong>Students:</strong> {students.length}
              </p>
            </Card>
          </Col>
        </Row>

        <Spin spinning={loading}>
          {students.length > 0 ? (
            <>
              <Table
                columns={marksTableColumns}
                dataSource={students}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                scroll={{ x: 1000 }}
                size="small"
              />
              <Row gutter={16} style={{ marginTop: '24px' }}>
                <Col span={24}>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    size="large"
                    onClick={handleSaveMarks}
                    loading={loading}
                    block
                  >
                    Save Marks for {students.length} Student(s)
                  </Button>
                </Col>
              </Row>
            </>
          ) : (
            <Empty description="No students found in this class" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default MarkEntry;

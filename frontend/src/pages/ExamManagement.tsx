import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  message,
  Select,
  Row,
  Col,
  Modal,
  Table,
  Spin,
  Form,
  Input,
  DatePicker,
  Empty,
  InputNumber,
  Tag
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [analyzeModalVisible, setAnalyzeModalVisible] = useState(false);
  const [selectedAnalyzeExam, setSelectedAnalyzeExam] = useState<any>(null);
  const [selectedClassForAnalytics, setSelectedClassForAnalytics] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [editingExam, setEditingExam] = useState<any>(null);
  const [filterSubject, setFilterSubject] = useState<number | null>(null);
  const [filterExamType, setFilterExamType] = useState<string | null>(null);

  const examTypes = ['Midterm', 'Final', 'Unit Test', 'Surprise Test', 'Practical'];

  useEffect(() => {
    fetchExams();
    fetchSubjects();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data?.data || response.data || []);
    } catch (error) {
      message.error('Failed to load classes');
    }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await api.getExams();
      setExams(response.data.data || response.data || []);
    } catch (error) {
      message.error('Failed to load exams');
    } finally {
      setLoading(false);
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

  const handleAddExam = () => {
    setEditingExam(null);
    form.resetFields();
    setFormVisible(true);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      setLoading(true);
      const examData = {
        ...values,
        examDate: values.examDate.format('YYYY-MM-DD')
      };

      if (editingExam) {
        await api.updateExam(editingExam.id, examData);
        message.success('Exam updated successfully');
      } else {
        await api.createExam(examData);
        message.success('Exam created successfully');
      }

      setFormVisible(false);
      await fetchExams();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save exam');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExam = (exam: any) => {
    setEditingExam(exam);
    form.setFieldsValue({
      examName: exam.exam_name,
      subjectId: exam.subject_id,
      examType: exam.exam_type,
      examDate: dayjs(exam.exam_date),
      maxMarks: exam.max_marks,
      passingMarks: exam.passing_marks,
      description: exam.description
    });
    setFormVisible(true);
  };

  const handleDeleteExam = async (examId: number) => {
    Modal.confirm({
      title: 'Delete Exam',
      content: 'Are you sure you want to delete this exam?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true);
          await api.deleteExam(examId);
          message.success('Exam deleted successfully');
          await fetchExams();
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Failed to delete exam');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleViewAnalytics = (exam: any) => {
    setSelectedAnalyzeExam(exam);
    setSelectedClassForAnalytics(null);
    setAnalyzeModalVisible(true);
  };

  const handleAnalyticsConfirm = () => {
    if (!selectedClassForAnalytics) {
      message.error('Please select a class');
      return;
    }
    setAnalyzeModalVisible(false);
    navigate(`/analytics/${selectedClassForAnalytics}`, { 
      state: { examId: selectedAnalyzeExam?.id } 
    });
  };

  // Filter exams based on selected filters
  const filteredExams = exams.filter((exam: any) => {
    const subjectMatch = !filterSubject || exam.subject_id === filterSubject;
    const typeMatch = !filterExamType || exam.exam_type === filterExamType;
    return subjectMatch && typeMatch;
  });

  const columns = [
    {
      title: 'Exam Name',
      dataIndex: 'exam_name',
      key: 'exam_name',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Subject',
      dataIndex: 'subject_id',
      key: 'subject',
      render: (subjectId: number) => {
        const subject = subjects.find((s: any) => s.id === subjectId);
        return subject ? subject.name : 'N/A';
      }
    },
    {
      title: 'Exam Type',
      dataIndex: 'exam_type',
      key: 'exam_type',
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Date',
      dataIndex: 'exam_date',
      key: 'exam_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Max Marks',
      dataIndex: 'max_marks',
      key: 'max_marks'
    },
    {
      title: 'Passing Marks',
      dataIndex: 'passing_marks',
      key: 'passing_marks'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '200px',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            icon={<BarChartOutlined />}
            size="small"
            type="primary"
            onClick={() => handleViewAnalytics(record)}
          >
            Analytics
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditExam(record)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteExam(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="Filter by Subject"
            allowClear
            value={filterSubject}
            onChange={setFilterSubject}
            style={{ width: '100%' }}
            options={[
              { label: 'All Subjects', value: null },
              ...subjects.map((s: any) => ({ label: s.name, value: s.id }))
            ]}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Select
            placeholder="Filter by Exam Type"
            allowClear
            value={filterExamType}
            onChange={setFilterExamType}
            style={{ width: '100%' }}
            options={[
              { label: 'All Types', value: null },
              ...examTypes.map((type) => ({ label: type, value: type }))
            ]}
          />
        </Col>
        <Col xs={24} sm={12} md={8} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddExam}
          >
            Add Exam
          </Button>
        </Col>
      </Row>

      <Card title="School-wide Exams">
        <Spin spinning={loading}>
          {filteredExams.length > 0 ? (
            <Table
              dataSource={filteredExams}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1000 }}
            />
          ) : (
            <Empty description={exams.length === 0 ? 'No exams found' : 'No exams match filters'} />
          )}
        </Spin>
      </Card>

      <Modal
        title="Select Class for Analytics"
        open={analyzeModalVisible}
        onCancel={() => setAnalyzeModalVisible(false)}
        onOk={handleAnalyticsConfirm}
        okText="View Analytics"
      >
        <p style={{ marginBottom: '16px' }}>
          Select a class to view analytics for <strong>{selectedAnalyzeExam?.exam_name}</strong>
        </p>
        <Select
          placeholder="Select Class"
          value={selectedClassForAnalytics}
          onChange={setSelectedClassForAnalytics}
          style={{ width: '100%' }}
          options={classes.map((cls: any) => ({
            label: cls.name || `Class ${cls.id}`,
            value: cls.id
          }))}
        />
      </Modal>

      <Modal
        title={editingExam ? 'Edit Exam' : 'Create New Exam'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Exam Name"
            name="examName"
            rules={[{ required: true, message: 'Please enter exam name' }]}
          >
            <Input placeholder="e.g., Midterm 2024" />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subjectId"
            rules={[{ required: true, message: 'Please select subject' }]}
          >
            <Select placeholder="Select subject">
              {subjects.map((subject: any) => (
                <Select.Option key={subject.id} value={subject.id}>
                  {subject.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Exam Type"
            name="examType"
            rules={[{ required: true, message: 'Please select exam type' }]}
          >
            <Select placeholder="Select exam type">
              {examTypes.map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Exam Date"
            name="examDate"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Max Marks"
                name="maxMarks"
                initialValue={100}
                rules={[{ required: true, message: 'Please enter max marks' }]}
              >
                <InputNumber min={1} max={500} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Passing Marks"
                name="passingMarks"
                initialValue={40}
                rules={[{ required: true, message: 'Please enter passing marks' }]}
              >
                <InputNumber min={0} max={500} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description (Optional)"
            name="description"
          >
            <Input.TextArea rows={3} placeholder="Add any additional notes" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {editingExam ? 'Update Exam' : 'Create Exam'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamManagement;

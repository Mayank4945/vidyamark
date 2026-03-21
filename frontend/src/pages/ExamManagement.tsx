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
  Table,
  Spin,
  Form,
  Input,
  DatePicker,
  Empty
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const ExamManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingExam, setEditingExam] = useState<any>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchExams(selectedClass);
      fetchSubjects(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await api.getClasses();
      setClasses(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedClass(response.data.data[0].id);
      }
    } catch (error) {
      message.error('Failed to load classes');
    }
  };

  const fetchExams = async (classId: number) => {
    try {
      setLoading(true);
      const response = await api.getExams(classId);
      setExams(response.data.data || []);
    } catch (error) {
      message.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async (classId: number) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.getSubjects();
      setSubjects(response.data.data || []);
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
        classId: selectedClass,
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
      if (selectedClass) {
        fetchExams(selectedClass);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId: number) => {
    try {
      setLoading(true);
      await api.deleteExam(examId);
      message.success('Exam deleted successfully');
      if (selectedClass) {
        fetchExams(selectedClass);
      }
    } catch (error) {
      message.error('Failed to delete exam');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Exam Name',
      dataIndex: 'examName',
      key: 'examName'
    },
    {
      title: 'Subject',
      dataIndex: 'subjectName',
      key: 'subjectName'
    },
    {
      title: 'Type',
      dataIndex: 'examType',
      key: 'examType',
      render: (type: string) => type.replace(/_/g, ' ').toUpperCase()
    },
    {
      title: 'Max Marks',
      dataIndex: 'maxMarks',
      key: 'maxMarks'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingExam(record);
              form.setFieldsValue({
                ...record,
                examDate: dayjs(record.examDate)
              });
              setFormVisible(true);
            }}
          />
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteExam(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card
        title="Exam Management"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExam}>
            Add Exam
          </Button>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Select Class
            </label>
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: '100%' }}
              placeholder="Choose a class"
              options={classes.map(cls => ({
                label: cls.name,
                value: cls.id
              }))}
            />
          </Col>
        </Row>

        <Spin spinning={loading}>
          {exams.length > 0 ? (
            <Table
              columns={columns}
              dataSource={exams.map((e, idx) => ({ ...e, key: idx }))}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          ) : (
            <Empty description="No exams found">
              <Button type="primary" onClick={handleAddExam}>
                Create First Exam
              </Button>
            </Empty>
          )}
        </Spin>
      </Card>

      <Modal
        title={editingExam ? 'Edit Exam' : 'Create Exam'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            label="Exam Name"
            name="examName"
            rules={[{ required: true, message: 'Please enter exam name' }]}
          >
            <Input placeholder="e.g., Unit Test 1" />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subjectId"
            rules={[{ required: true, message: 'Please select subject' }]}
          >
            <Select
              placeholder="Select subject"
              options={subjects.map(s => ({ label: s.name, value: s.id }))}
            />
          </Form.Item>

          <Form.Item
            label="Exam Type"
            name="examType"
            rules={[{ required: true, message: 'Please select exam type' }]}
          >
            <Select
              placeholder="Select exam type"
              options={[
                { label: 'Unit Test', value: 'unit_test' },
                { label: 'Mid Term', value: 'mid_term' },
                { label: 'Final Term', value: 'final_term' },
                { label: 'Assignment', value: 'assignment' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Exam Date"
            name="examDate"
            rules={[{ required: true, message: 'Please select exam date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="Max Marks"
            name="maxMarks"
            rules={[{ required: true, message: 'Please enter max marks' }]}
          >
            <Input type="number" placeholder="100" />
          </Form.Item>

          <Form.Item
            label="Passing Marks"
            name="passingMarks"
          >
            <Input type="number" placeholder="40" />
          </Form.Item>

          <Form.Item
            label="Weightage (%)"
            name="weightage"
          >
            <Input type="number" placeholder="100" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              {editingExam ? 'Update Exam' : 'Create Exam'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamManagement;

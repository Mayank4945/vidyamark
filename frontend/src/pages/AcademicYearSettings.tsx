import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Table,
  Spin,
  Form,
  Input,
  DatePicker,
  Switch,
  Empty,
  Tag,
  Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AcademicYearSettings: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await api.getAcademicYears(true); // Include inactive
      // The response structure is { success: true, data: [...] }
      setAcademicYears(response.data?.data || []);
    } catch (error) {
      message.error('Failed to load academic years');
    } finally {
      setLoading(false);
    }
  };

  const handleAddYear = () => {
    setEditingYear(null);
    form.resetFields();
    setFormVisible(true);
  };

  const handleEditYear = (year: AcademicYear) => {
    setEditingYear(year);
    form.setFieldsValue({
      name: year.name,
      startDate: dayjs(year.start_date),
      endDate: dayjs(year.end_date),
      isActive: year.is_active,
    });
    setFormVisible(true);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      setLoading(true);
      const yearData = {
        name: values.name,
        start_date: values.startDate.format('YYYY-MM-DD'),
        end_date: values.endDate.format('YYYY-MM-DD'),
        is_active: values.isActive || false,
      };

      if (editingYear) {
        await api.updateAcademicYear(editingYear.id, yearData);
        message.success('Academic year updated successfully');
      } else {
        await api.createAcademicYear(yearData);
        message.success('Academic year created successfully');
      }

      setFormVisible(false);
      await fetchAcademicYears();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save academic year');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteYear = async (yearId: number) => {
    try {
      setLoading(true);
      await api.deleteAcademicYear(yearId);
      message.success('Academic year deleted successfully');
      await fetchAcademicYears();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete academic year');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Academic Year',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '200px',
      render: (_: any, record: AcademicYear) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditYear(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Academic Year"
            description="Are you sure you want to delete this academic year? This will also delete all associated grading policies and exams."
            icon={<ExclamationCircleOutlined />}
            onConfirm={() => handleDeleteYear(record.id)}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Academic Year Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddYear}
          >
            Add Academic Year
          </Button>
        }
      >
        <Spin spinning={loading}>
          {academicYears.length > 0 ? (
            <Table
              dataSource={academicYears}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="No academic years found" />
          )}
        </Spin>
      </Card>

      <Modal
        title={editingYear ? 'Edit Academic Year' : 'Add Academic Year'}
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
            label="Academic Year Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter academic year name' },
              { min: 3, message: 'Name must be at least 3 characters' },
            ]}
            tooltip="e.g., 2025-26, 2026-27"
          >
            <Input placeholder="e.g., 2025-26" />
          </Form.Item>

          <Form.Item
            label="Start Date"
            name="startDate"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="End Date"
            name="endDate"
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            label="Set as Active Year"
            name="isActive"
            valuePropName="checked"
            tooltip="Only one academic year can be active at a time. Setting this as active will deactivate others."
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setFormVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingYear ? 'Update' : 'Create'} Academic Year
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AcademicYearSettings;

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Modal, Form, Input, Spin, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import api from '../services/api';

const Schools: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await api.getSchools();
      setSchools(response.data.data || []);
    } catch (error: any) {
      message.error('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = () => {
    setEditingSchool(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditSchool = (school: any) => {
    setEditingSchool(school);
    form.setFieldsValue(school);
    setModalVisible(true);
  };

  const handleDeleteSchool = (schoolId: number) => {
    Modal.confirm({
      title: 'Delete School',
      content: 'Are you sure you want to delete this school? This action cannot be undone.',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true);
          await api.deleteSchool(schoolId);
          message.success('School deleted successfully');
          fetchSchools();
        } catch (error: any) {
          message.error('Failed to delete school');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingSchool) {
        await api.updateSchool(editingSchool.id, values);
        message.success('School updated successfully');
      } else {
        await api.createSchool(values);
        message.success('School created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchSchools();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const columns: any = [
    {
      title: 'School Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Principal',
      dataIndex: 'principal',
      key: 'principal'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditSchool(record)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteSchool(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card
      title="School Management"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSchool}>
          Add School
        </Button>
      }
    >
      <Spin spinning={loading}>
        {schools.length > 0 ? (
          <Table
            dataSource={schools}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="No schools found" />
        )}
      </Spin>

      <Modal
        title={editingSchool ? 'Edit School' : 'Create School'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="School Name"
            name="name"
            rules={[{ required: true, message: 'Please enter school name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Principal Name"
            name="principal"
            rules={[{ required: true, message: 'Please enter principal name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {editingSchool ? 'Update School' : 'Create School'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Schools;

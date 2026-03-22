import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Modal, Form, Input, Select, Spin, Tag, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import api from '../services/api';

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();
  const [schools, setSchools] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isMainAdmin = user.role === 'main_admin';

  useEffect(() => {
    fetchUsers();
    fetchSchools();
    fetchSubjects();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      setUsers(response.data.data || []);
    } catch (error: any) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await api.getSchools();
      setSchools(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.getSubjects();
      setSubjects(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleDeleteUser = (userId: number) => {
    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user?',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true);
          await api.deleteUser(userId);
          message.success('User deleted successfully');
          fetchUsers();
        } catch (error: any) {
          message.error('Failed to delete user');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingUser) {
        await api.updateUser(editingUser.id, values);
        message.success('User updated successfully');
      } else {
        await api.createUser(values);
        message.success('User created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const columns: any = [
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: any) => `${record.firstName} ${record.lastName}`
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'main_admin' ? 'red' : role === 'school_admin' ? 'blue' : 'green'}>
          {role.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'School',
      dataIndex: 'schoolName',
      key: 'schoolName'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.role !== 'main_admin' && (
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteUser(record.id)}
            >
              Delete
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      title="User Management"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateUser}>
          Create User
        </Button>
      }
    >
      <Spin spinning={loading}>
        {users.length > 0 ? (
          <Table
            dataSource={users}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <Empty description="No users found" />
        )}
      </Spin>

      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: 'Please enter first name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Please enter last name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter password' }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select placeholder="Select role">
              {isMainAdmin && <Select.Option value="school_admin">School Admin</Select.Option>}
              <Select.Option value="teacher">Teacher</Select.Option>
            </Select>
          </Form.Item>

          {form.getFieldValue('role') === 'school_admin' && (
            <Form.Item
              label="School"
              name="schoolId"
              rules={[{ required: true, message: 'Please select school' }]}
            >
              <Select placeholder="Select school">
                {schools.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          {form.getFieldValue('role') === 'teacher' && (
            <>
              <Form.Item
                label="School"
                name="schoolId"
                rules={[{ required: true, message: 'Please select school' }]}
              >
                <Select placeholder="Select school">
                  {schools.map((s) => (
                    <Select.Option key={s.id} value={s.id}>
                      {s.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Subject"
                name="subjectId"
                rules={[{ required: true, message: 'Please select subject' }]}
              >
                <Select placeholder="Select subject">
                  {subjects.map((s) => (
                    <Select.Option key={s.id} value={s.id}>
                      {s.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;

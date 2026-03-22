import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Row, Col, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Register.css';

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await api.getSchools();
      setSchools(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.register(
        values.email,
        values.password,
        values.firstName,
        values.lastName,
        values.schoolId,
        values.role
      );

      // Save token and user data
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));

      message.success('Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={22} sm={20} md={12} lg={8} xl={6}>
          <Card
            className="register-card"
            title={
              <div className="register-header">
                <h1>🎓 VidyaMark</h1>
                <p>Create an Account</p>
              </div>
            }
          >
            <Form
              form={form}
              name="register"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[{ required: true, message: 'Please enter your first name' }]}
              >
                <Input placeholder="First name" size="large" />
              </Form.Item>

              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[{ required: true, message: 'Please enter your last name' }]}
              >
                <Input placeholder="Last name" size="large" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="teacher@school.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="School"
                name="schoolId"
                rules={[{ required: true, message: 'Please select your school' }]}
              >
                <Select placeholder="Select your school" size="large">
                  {schools.map((school) => (
                    <Select.Option key={school.id} value={school.id}>
                      {school.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Role"
                name="role"
                initialValue="teacher"
                rules={[{ required: true, message: 'Please select your role' }]}
              >
                <Select placeholder="Select your role" size="large">
                  <Select.Option value="teacher">Teacher</Select.Option>
                  <Select.Option value="school_admin">School Admin</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter your password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password placeholder="Password" size="large" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    }
                  })
                ]}
              >
                <Input.Password placeholder="Confirm password" size="large" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Register
                </Button>
              </Form.Item>

              <div className="register-footer">
                <p>Already have an account?</p>
                <Button type="link" onClick={() => navigate('/login')} block>
                  Login here
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Register;

import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Row, Col, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Login.css';

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await api.login(values.email, values.password);
      
      // Save token and user data
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      
      message.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Row justify="center" align="middle" style={{ minHeight: '100vh' }}>
        <Col xs={22} sm={20} md={12} lg={8} xl={6}>
          <Card
            className="login-card"
            title={
              <div className="login-header">
                <h1>🎓 VidyaMark</h1>
                <p>Student Management System</p>
              </div>
            }
          >
            <Form
              form={form}
              name="login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="teacher@school.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Login
                </Button>
              </Form.Item>

              <div className="login-footer">
                <p>Don't have an account?</p>
                <Button
                  type="link"
                  onClick={() => navigate('/register')}
                  block
                >
                  Register here
                </Button>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f2f5', borderRadius: '4px' }}>
                <p style={{ fontSize: '12px', marginBottom: '8px' }}>
                  <strong>Demo Credentials:</strong>
                </p>
                <p style={{ fontSize: '11px', marginBottom: '4px' }}>
                  <strong>Main Admin:</strong> admin@vidyamark.com / admin123
                </p>
                <p style={{ fontSize: '11px' }}>
                  <strong>For Teachers:</strong> Use registration form to request access
                </p>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;

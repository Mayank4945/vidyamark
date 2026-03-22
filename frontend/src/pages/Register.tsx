import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Row, Col, Select, Steps } from 'antd';
import { MailOutlined, UserOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Register.css';

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schoolsRes, subjectsRes] = await Promise.all([
        api.getSchools(),
        api.getSubjects()
      ]);
      setSchools(schoolsRes.data.data || []);
      setSubjects(subjectsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      message.error('Failed to load schools or subjects');
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Use the new registration request endpoint
      const response = await api.post('/auth/register-request', {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        schoolId: values.schoolId,
        subjectId: values.subjectId
      });

      setSubmittedEmail(values.email);
      setSubmitted(true);
      form.resetFields();
      message.success('Registration request submitted! Please wait for approval.');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Registration request failed';
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
                <p>{submitted ? 'Request Submitted' : 'Teacher Registration Request'}</p>
              </div>
            }
          >
            {submitted ? (
              <div style={{ textAlign: 'center' }}>
                <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                <h2 style={{ marginBottom: '8px' }}>Request Submitted Successfully!</h2>
                <p style={{ color: '#666', marginBottom: '16px' }}>
                  Your registration request has been submitted for approval.
                </p>
                <p style={{ color: '#999', marginBottom: '24px', fontSize: '12px' }}>
                  Email: <strong>{submittedEmail}</strong>
                </p>
                <p style={{ color: '#666', marginBottom: '24px' }}>
                  Your school admin or the main admin will review your request and approve/reject it.
                  You will be notified once your account is activated.
                </p>
                <Button type="primary" onClick={() => navigate('/login')} size="large" block>
                  Go to Login
                </Button>
              </div>
            ) : (
              <Form
                form={form}
                name="register-request"
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
              >
                <Form.Item
                  label="First Name"
                  name="firstName"
                  rules={[{ required: true, message: 'Please enter your first name' }]}
                >
                  <Input placeholder="John" size="large" />
                </Form.Item>

                <Form.Item
                  label="Last Name"
                  name="lastName"
                  rules={[{ required: true, message: 'Please enter your last name' }]}
                >
                  <Input placeholder="Doe" size="large" />
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
                  label="Subject You Teach"
                  name="subjectId"
                  rules={[{ required: true, message: 'Please select your subject' }]}
                >
                  <Select placeholder="Select your subject" size="large">
                    {subjects.map((subject) => (
                      <Select.Option key={subject.id} value={subject.id}>
                        {subject.name}
                      </Select.Option>
                    ))}
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
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="At least 6 characters"
                    size="large"
                  />
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
                    style={{ marginBottom: '12px' }}
                  >
                    Submit Registration Request
                  </Button>
                </Form.Item>

                <div className="register-footer" style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                  <p style={{ marginBottom: '8px' }}>
                    📝 Your registration request will be reviewed by your school admin or main admin and you'll be notified once approved.
                  </p>
                  <p>
                    Already have an account?{' '}
                    <Button type="link" onClick={() => navigate('/login')} style={{ padding: 0 }}>
                      Login here
                    </Button>
                  </p>
                </div>
              </Form>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Register;

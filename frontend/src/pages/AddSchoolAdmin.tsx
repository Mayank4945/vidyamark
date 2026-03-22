import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Spin, Select, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const AddSchoolAdmin: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  const [loading, setLoading] = useState(false);
  const [school, setSchool] = useState<any>(null);

  useEffect(() => {
    // Fetch school details
    if (schoolId) {
      const fetchSchool = async () => {
        try {
          const response = await api.getSchools();
          const selectedSchool = response.data?.find((s: any) => s.id === parseInt(schoolId));
          if (selectedSchool) {
            setSchool(selectedSchool);
          } else {
            message.error('School not found');
            navigate('/schools');
          }
        } catch (err: any) {
          message.error('Failed to load school');
          navigate('/schools');
        }
      };
      fetchSchool();
    }
  }, [schoolId, navigate]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const userData = {
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        schoolId: parseInt(schoolId!),
        role: 'school_admin'
      };

      const response = await api.createUser(userData);

      if (response.data?.success) {
        message.success(`School admin ${values.email} created successfully!`);
        form.resetFields();
        navigate('/schools');
      } else {
        message.error(response.data?.error || 'Failed to create school admin');
      }
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || 'Failed to create school admin');
    } finally {
      setLoading(false);
    }
  };

  if (!school && schoolId) {
    return <Spin />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/schools')}
          >
            Back to Schools
          </Button>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={24} md={16}>
          <Card
            title={`Add School Admin - ${school?.name || 'School'}`}
            style={{ maxWidth: '600px' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
            >
              <Form.Item
                label="First Name"
                name="firstName"
                rules={[
                  { required: true, message: 'Please enter first name' },
                  { min: 2, message: 'First name must be at least 2 characters' }
                ]}
              >
                <Input placeholder="Enter admin first name" />
              </Form.Item>

              <Form.Item
                label="Last Name"
                name="lastName"
                rules={[
                  { required: true, message: 'Please enter last name' },
                  { min: 2, message: 'Last name must be at least 2 characters' }
                ]}
              >
                <Input placeholder="Enter admin last name" />
              </Form.Item>

              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter admin email" type="email" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                rules={[
                  { required: true, message: 'Please confirm password' },
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
                <Input.Password placeholder="Confirm password" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                >
                  Create School Admin
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AddSchoolAdmin;

import React, { useState } from 'react';
import { Form, Input, DatePicker, Button, Space, Modal } from 'antd';
import type { FormInstance } from 'antd/es/form';

interface StudentFormData {
  rollNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  parentName?: string;
  parentContact?: string;
}

interface StudentFormProps {
  visible: boolean;
  loading: boolean;
  initialData?: StudentFormData;
  onSubmit: (data: StudentFormData) => void;
  onCancel: () => void;
  title?: string;
}

const StudentForm: React.FC<StudentFormProps> = ({
  visible,
  loading,
  initialData,
  onSubmit,
  onCancel,
  title = 'Add Student',
}) => {
  const [form] = Form.useForm<StudentFormData>();

  React.useEffect(() => {
    if (visible) {
      if (initialData) {
        form.setFieldsValue(initialData);
      } else {
        form.resetFields();
      }
    }
  }, [visible, initialData, form]);

  const handleSubmit = async (values: StudentFormData) => {
    onSubmit(values);
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Roll Number"
          name="rollNumber"
          rules={[{ required: true, message: 'Please enter roll number' }]}
        >
          <Input placeholder="e.g., 001" />
        </Form.Item>

        <Form.Item
          label="First Name"
          name="firstName"
          rules={[{ required: true, message: 'Please enter first name' }]}
        >
          <Input placeholder="First name" />
        </Form.Item>

        <Form.Item
          label="Last Name"
          name="lastName"
          rules={[{ required: true, message: 'Please enter last name' }]}
        >
          <Input placeholder="Last name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ type: 'email', message: 'Please enter valid email' }]}
        >
          <Input placeholder="student@example.com" />
        </Form.Item>

        <Form.Item
          label="Phone"
          name="phone"
        >
          <Input placeholder="+1234567890" />
        </Form.Item>

        <Form.Item
          label="Parent Name"
          name="parentName"
        >
          <Input placeholder="Parent's name" />
        </Form.Item>

        <Form.Item
          label="Parent Contact"
          name="parentContact"
        >
          <Input placeholder="+1234567890" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {initialData ? 'Update' : 'Add'} Student
            </Button>
            <Button onClick={onCancel}>
              Cancel
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StudentForm;

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
  Select,
  Empty,
  Row,
  Col,
  InputNumber,
  Popconfirm,
  Alert,
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

interface Weightage {
  id?: number;
  exam_type: string;
  display_name: string;
  weight_percentage: number;
  sequence_order: number;
}

interface GradingPolicy {
  id: number;
  name: string;
  description?: string;
  academic_year_id: number;
  academic_year: string;
  weightages: Weightage[];
  is_active: boolean;
  created_at: string;
}

const GradingPolicySettings: React.FC = () => {
  const [gradingPolicies, setGradingPolicies] = useState<GradingPolicy[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<GradingPolicy | null>(null);
  const [form] = Form.useForm();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);

  const examTypeOptions = [
    { label: 'Unit Test 1', value: 'unit_test_1' },
    { label: 'Unit Test 2', value: 'unit_test_2' },
    { label: 'Unit Test 3', value: 'unit_test_3' },
    { label: 'Midterm', value: 'midterm' },
    { label: 'Final Term', value: 'final_term' },
    { label: 'Project', value: 'project' },
    { label: 'Practical', value: 'practical' },
    { label: 'Assignment', value: 'assignment' },
  ];

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchGradingPolicies(selectedAcademicYear);
    }
  }, [selectedAcademicYear]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.getAcademicYears(true);
      const years = response.data || [];
      setAcademicYears(years);
      if (years.length > 0) {
        setSelectedAcademicYear(years[0].id);
      }
    } catch (error) {
      message.error('Failed to load academic years');
    }
  };

  const fetchGradingPolicies = async (academicYearId: number) => {
    try {
      setLoading(true);
      const response = await api.getGradingPolicies(academicYearId);
      setGradingPolicies(response.data || []);
    } catch (error) {
      message.error('Failed to load grading policies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = () => {
    setEditingPolicy(null);
    form.resetFields();
    setFormVisible(true);
  };

  const handleEditPolicy = (policy: GradingPolicy) => {
    setEditingPolicy(policy);
    const weightages = policy.weightages.map((w, idx) => ({
      key: `${w.exam_type}-${idx}`,
      examType: w.exam_type,
      displayName: w.display_name,
      weightPercentage: w.weight_percentage,
    }));
    form.setFieldsValue({
      name: policy.name,
      description: policy.description,
      weightages: weightages,
    });
    setFormVisible(true);
  };

  const calculateTotalWeight = (weightages: any[]) => {
    return weightages.reduce((sum, w) => sum + (w?.weightPercentage || 0), 0);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Validate weightages sum to 100
      const totalWeight = calculateTotalWeight(values.weightages || []);
      if (Math.abs(totalWeight - 100) > 0.01) {
        message.error(`Weightages must sum to 100%. Current total: ${totalWeight.toFixed(2)}%`);
        setLoading(false);
        return;
      }

      const policyData = {
        name: values.name,
        description: values.description,
        academic_year_id: selectedAcademicYear,
        weightages: (values.weightages || []).map((w: any, idx: number) => ({
          exam_type: w.examType,
          display_name: w.displayName || w.examType,
          weight_percentage: w.weightPercentage,
          sequence_order: idx,
        })),
      };

      if (editingPolicy) {
        await api.updateGradingPolicy({ id: editingPolicy.id, ...policyData });
        message.success('Grading policy updated successfully');
      } else {
        await api.createGradingPolicy(policyData);
        message.success('Grading policy created successfully');
      }

      setFormVisible(false);
      if (selectedAcademicYear) {
        await fetchGradingPolicies(selectedAcademicYear);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save grading policy');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (policyId: number) => {
    try {
      setLoading(true);
      await api.deleteGradingPolicy(policyId);
      message.success('Grading policy deleted successfully');
      if (selectedAcademicYear) {
        await fetchGradingPolicies(selectedAcademicYear);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to delete grading policy');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Policy Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Weightages',
      dataIndex: 'weightages',
      key: 'weightages',
      render: (weightages: Weightage[]) => (
        <div style={{ fontSize: '12px' }}>
          {weightages.slice(0, 3).map((w) => (
            <div key={w.exam_type}>
              {w.display_name}: {w.weight_percentage}%
            </div>
          ))}
          {weightages.length > 3 && <div>+ {weightages.length - 3} more</div>}
        </div>
      ),
    },
    {
      title: 'Total Weight',
      dataIndex: 'weightages',
      key: 'total_weight',
      render: (weightages: Weightage[]) => {
        const total = weightages.reduce((sum, w) => sum + w.weight_percentage, 0);
        const isValid = Math.abs(total - 100) < 0.01;
        return (
          <span style={{ color: isValid ? 'green' : 'red', fontWeight: 'bold' }}>
            {total.toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '200px',
      render: (_: any, record: GradingPolicy) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditPolicy(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Grading Policy"
            description="Are you sure you want to delete this policy?"
            icon={<ExclamationCircleOutlined />}
            onConfirm={() => handleDeletePolicy(record.id)}
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
        title="Grading Policy Management"
        extra={
          <Space>
            <Select
              style={{ width: '200px' }}
              placeholder="Select Academic Year"
              value={selectedAcademicYear}
              onChange={setSelectedAcademicYear}
              options={academicYears.map((ay) => ({
                label: ay.name,
                value: ay.id,
              }))}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPolicy}
              disabled={!selectedAcademicYear}
            >
              Add Policy
            </Button>
          </Space>
        }
      >
        {!selectedAcademicYear ? (
          <Alert
            message="Please select an academic year first"
            type="info"
            style={{ marginBottom: '16px' }}
          />
        ) : null}

        <Spin spinning={loading}>
          {gradingPolicies.length > 0 ? (
            <Table
              dataSource={gradingPolicies}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty description="No grading policies found for this academic year" />
          )}
        </Spin>
      </Card>

      <Modal
        title={editingPolicy ? 'Edit Grading Policy' : 'Create Grading Policy'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Policy Name"
            name="name"
            rules={[{ required: true, message: 'Please enter policy name' }]}
            tooltip="e.g., Standard Grading 2025-26"
          >
            <Input placeholder="e.g., Standard Grading Policy" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea
              placeholder="Optional description of this grading policy"
              rows={3}
            />
          </Form.Item>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' }}>
              Exam Type Weightages
            </div>

            <Form.List name="weightages">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <Row key={field.key} gutter={16} style={{ marginBottom: '12px' }}>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'examType']}
                          rules={[{ required: true, message: 'Select exam type' }]}
                        >
                          <Select
                            placeholder="Exam Type"
                            options={examTypeOptions}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'displayName']}
                          rules={[{ required: true, message: 'Enter display name' }]}
                        >
                          <Input placeholder="Display Name" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'weightPercentage']}
                          rules={[
                            { required: true, message: 'Enter percentage' },
                            { type: 'number', min: 0, max: 100 },
                          ]}
                        >
                          <InputNumber
                            placeholder="%"
                            suffix="%"
                            precision={2}
                            min={0}
                            max={100}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={2} style={{ textAlign: 'center' }}>
                        <Button
                          danger
                          type="text"
                          onClick={() => remove(field.name)}
                          disabled={fields.length === 1}
                        >
                          Delete
                        </Button>
                      </Col>
                    </Row>
                  ))}

                  <Button type="dashed" onClick={() => add()} block style={{ marginBottom: '12px' }}>
                    + Add Weightage
                  </Button>

                  {fields.length > 0 && (
                    <Alert
                      message={`Total Weight: ${calculateTotalWeight(
                        form.getFieldValue('weightages') || []
                      ).toFixed(2)}% (Must be 100%)`}
                      type={
                        Math.abs(
                          calculateTotalWeight(form.getFieldValue('weightages') || []) - 100
                        ) < 0.01
                          ? 'success'
                          : 'warning'
                      }
                      style={{ marginBottom: '12px' }}
                    />
                  )}
                </>
              )}
            </Form.List>
          </div>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setFormVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingPolicy ? 'Update' : 'Create'} Policy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GradingPolicySettings;

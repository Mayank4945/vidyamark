import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, message, Modal, Form, Input, Spin, Tag, Empty, Collapse } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../services/api';

const UserRequests: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.getUserRequests();
      setRequests(response.data.data || []);
    } catch (error: any) {
      message.error('Failed to load registration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setLoading(true);
      await api.approveUserRequest(requestId);
      message.success('Request approved successfully');
      fetchRequests();
    } catch (error: any) {
      message.error('Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (request: any) => {
    setRejectingRequest(request);
    form.resetFields();
    setRejectModalVisible(true);
  };

  const handleRejectSubmit = async (values: any) => {
    try {
      setLoading(true);
      await api.rejectUserRequest(rejectingRequest.id, values.rejectionReason);
      message.success('Request rejected successfully');
      setRejectModalVisible(false);
      fetchRequests();
    } catch (error: any) {
      message.error('Failed to reject request');
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
      title: 'School',
      dataIndex: 'schoolName',
      key: 'schoolName'
    },
    {
      title: 'Subject',
      dataIndex: 'subjectName',
      key: 'subjectName'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'blue';
        if (status === 'approved') color = 'green';
        if (status === 'rejected') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Requested At',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                onClick={() => handleApprove(record.id)}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                size="small"
                onClick={() => handleRejectClick(record)}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'rejected' && record.rejectionReason && (
            <Button type="text" size="small">
              Reason: {record.rejectionReason}
            </Button>
          )}
        </Space>
      )
    }
  ];

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div>
      <Card
        title="Registration Requests"
        style={{ marginBottom: '20px' }}
      >
        <Spin spinning={loading}>
          {pendingRequests.length > 0 ? (
            <Table
              dataSource={pendingRequests}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              title={() => <strong>Pending Requests ({pendingRequests.length})</strong>}
            />
          ) : (
            <Empty description="No pending requests" />
          )}
        </Spin>
      </Card>

      {processedRequests.length > 0 && (
        <Card title="Processed Requests">
          <Spin spinning={loading}>
            <Table
              dataSource={processedRequests}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Spin>
        </Card>
      )}

      <Modal
        title="Reject Registration Request"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleRejectSubmit}>
          <p>
            Rejecting request from: <strong>{rejectingRequest?.firstName} {rejectingRequest?.lastName}</strong>
          </p>

          <Form.Item
            label="Rejection Reason"
            name="rejectionReason"
            rules={[{ required: true, message: 'Please provide a reason for rejection' }]}
          >
            <Input.TextArea rows={4} placeholder="Explain why this request is being rejected..." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" danger htmlType="submit" loading={loading} block>
              Reject Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserRequests;

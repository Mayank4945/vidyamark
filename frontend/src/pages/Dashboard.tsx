import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Table,
  message,
  Select,
  Spin
} from 'antd';
import {
  UserAddOutlined,
  TeamOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  PlusOutlined
} from '@ant-design/icons';
import api from '../services/api';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await api.getClasses();
      
      if (response.data.data && response.data.data.length > 0) {
        setClasses(response.data.data);
        setSelectedClass(response.data.data[0].id);
      }
    } catch (error: any) {
      message.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: number) => {
    try {
      const response = await api.getStudents(classId);
      setStudents(response.data.data || []);
      setStats(prev => ({
        ...prev,
        totalStudents: response.data.count || 0
      }));
    } catch (error: any) {
      message.error('Failed to load students');
    }
  };

  const columns = [
    {
      title: 'Roll No',
      dataIndex: 'rollNumber',
      key: 'rollNumber'
    },
    {
      title: 'Student Name',
      dataIndex: 'fullName',
      key: 'fullName'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-'
    },
    {
      title: 'Parent Contact',
      dataIndex: 'parentContact',
      key: 'parentContact',
      render: (contact: string) => contact || '-'
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Classes"
              value={classes.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Quick Actions"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              Add Student
            </Button>
            <Button icon={<FileExcelOutlined />}>
              Export Excel
            </Button>
            <Button icon={<FilePdfOutlined />}>
              Export PDF
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12}>
            <label>Select Class:</label>
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: '100%', marginTop: '8px' }}
              placeholder="Choose a class"
              options={classes.map(cls => ({
                label: cls.name,
                value: cls.id
              }))}
            />
          </Col>
        </Row>

        <h3>Students in Class</h3>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={students.map((s, idx) => ({ ...s, key: idx }))}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Dashboard;

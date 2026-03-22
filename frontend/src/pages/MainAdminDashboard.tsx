import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, List, Spin, Empty, Space, message, Badge } from 'antd';
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  PlusOutlined,
  FileTextOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface DashboardStats {
  totalSchools: number;
  totalTeachers: number;
  totalStudents: number;
  pendingRequests: number;
}

const MainAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalTeachers: 0,
    totalStudents: 0,
    pendingRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch schools
      const schoolsResponse = await api.getSchools();
      const schools = schoolsResponse.data || [];

      // Fetch users to count teachers
      const usersResponse = await api.getUsers();
      const users = usersResponse.data?.data || usersResponse.data || [];
      const teachers = users.filter((u: any) => u.role === 'teacher');

      // For student count, we'll just set to 0 since we don't have a general getStudents without classId
      const studentCount = 0;

      // Fetch pending registration requests
      let pendingCount = 0;
      let recentReqs: any[] = [];
      try {
        const requestsResponse = await api.getUserRequests();
        const allRequests = requestsResponse.data || [];
        recentReqs = allRequests
          .filter((r: any) => r.status === 'pending')
          .slice(0, 5);
        pendingCount = allRequests.filter((r: any) => r.status === 'pending').length;
      } catch (err) {
        console.error('Error fetching requests:', err);
      }

      setStats({
        totalSchools: schools.length,
        totalTeachers: teachers.length,
        totalStudents: studentCount,
        pendingRequests: pendingCount
      });

      setRecentRequests(recentReqs);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Add School',
      icon: <HomeOutlined />,
      color: '#1890ff',
      onClick: () => navigate('/schools')
    },
    {
      title: 'Manage Users',
      icon: <TeamOutlined />,
      color: '#52c41a',
      onClick: () => navigate('/user-management')
    },
    {
      title: 'Review Requests',
      icon: <FileTextOutlined />,
      color: '#faad14',
      onClick: () => navigate('/user-requests')
    },
    {
      title: 'Settings',
      icon: <SettingOutlined />,
      color: '#722ed1',
      onClick: () => navigate('/settings')
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px', color: '#000', fontSize: '28px', fontWeight: 600 }}>
        Admin Dashboard
      </h1>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Schools"
              value={stats.totalSchools}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Teachers"
              value={stats.totalTeachers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Students"
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#faad14', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={stats.pendingRequests}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f', fontSize: '28px', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={16} style={{ marginBottom: '32px' }}>
        <Col xs={24}>
          <Card title="Quick Actions" bordered={true}>
            <Space wrap style={{ width: '100%' }}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  type="primary"
                  size="large"
                  icon={action.icon}
                  onClick={action.onClick}
                  style={{
                    backgroundColor: action.color,
                    borderColor: action.color,
                    minWidth: '140px'
                  }}
                >
                  {action.title}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Recent Requests */}
      <Row gutter={16}>
        <Col xs={24}>
          <Card
            title={`Recent Registration Requests (${stats.pendingRequests} Pending)`}
            extra={
              <Button
                type="link"
                onClick={() => navigate('/user-requests')}
              >
                View All
              </Button>
            }
          >
            {loading ? (
              <Spin />
            ) : recentRequests.length === 0 ? (
              <Empty
                description={stats.pendingRequests > 0 ? 'Loading...' : 'No pending requests'}
              />
            ) : (
              <List
                dataSource={recentRequests}
                renderItem={(request: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<UserOutlined />}
                      title={`${request.first_name} ${request.last_name}`}
                      description={
                        <div>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Email:</strong> {request.email}
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>School:</strong> {request.school_name}
                          </p>
                          <p style={{ margin: '4px 0' }}>
                            <strong>Subject:</strong> {request.subject_name || 'Not specified'}
                          </p>
                          <Badge
                            status="processing"
                            text={<span style={{ color: '#faad14' }}>Pending Review</span>}
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MainAdminDashboard;

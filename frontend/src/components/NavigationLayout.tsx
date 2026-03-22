import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Spin } from 'antd';
import { LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { MenuProps } from 'antd';
import api from '../services/api';

const { Header, Sider, Content } = Layout;

const NavigationLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    // Only fetch school if user is not main_admin and has schoolId
    if (user.schoolId && user.role !== 'main_admin') {
      fetchSchool();
    }
  }, [user.schoolId, user.role]);

  const fetchSchool = async () => {
    try {
      setLoading(true);
      const response = await api.getSchoolById(user.schoolId);
      setSchool(response.data.data);
    } catch (error) {
      console.error('Failed to fetch school:', error);
    } finally {
      setLoading(false);
    }
  };

  // Main Admin menu items
  const mainAdminMenuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      label: '📊 Dashboard',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/schools',
      label: '🏫 Schools',
      onClick: () => navigate('/schools')
    },
    {
      key: '/users',
      label: '👥 User Management',
      onClick: () => navigate('/users')
    },
    {
      key: '/user-requests',
      label: '📋 Registration Requests',
      onClick: () => navigate('/user-requests')
    },
    {
      key: '/reports',
      label: '📈 Reports',
      onClick: () => navigate('/reports')
    },
    {
      key: '/settings',
      label: '⚙️ Settings',
      onClick: () => navigate('/settings')
    }
  ];

  // School Admin menu items
  const schoolAdminMenuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      label: '📊 Dashboard',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/students',
      label: '👥 Students',
      onClick: () => navigate('/students')
    },
    {
      key: '/exams',
      label: '📝 Exams',
      onClick: () => navigate('/exams')
    },
    {
      key: '/marks',
      label: '✏️ Marks',
      onClick: () => navigate('/marks')
    },
    {
      key: '/users',
      label: '👨‍🏫 Teachers',
      onClick: () => navigate('/users')
    },
    {
      key: '/user-requests',
      label: '📋 Pending Requests',
      onClick: () => navigate('/user-requests')
    },
    {
      key: '/reports',
      label: '📈 Reports',
      onClick: () => navigate('/reports')
    },
    {
      key: '/settings',
      label: '⚙️ Settings',
      onClick: () => navigate('/settings')
    }
  ];

  // Admin menu items
  const adminMenuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      label: '📊 Dashboard',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/students',
      label: '👥 Students',
      onClick: () => navigate('/students')
    },
    {
      key: '/exams',
      label: '📝 Exams',
      onClick: () => navigate('/exams')
    },
    {
      key: '/marks',
      label: '✏️ Marks',
      onClick: () => navigate('/marks')
    },
    {
      key: '/reports',
      label: '📈 Reports',
      onClick: () => navigate('/reports')
    },
    {
      key: '/settings',
      label: '⚙️ Settings',
      onClick: () => navigate('/settings')
    }
  ];

  // Teacher menu items (only marks entry)
  const teacherMenuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      label: '📊 Dashboard',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/marks',
      label: '✏️ Enter Marks',
      onClick: () => navigate('/marks')
    },
    {
      key: '/reports',
      label: '📋 Reports',
      onClick: () => navigate('/reports')
    },
    {
      key: '/settings',
      label: '⚙️ Settings',
      onClick: () => navigate('/settings')
    }
  ];

  const menuItems =
    user.role === 'main_admin'
      ? mainAdminMenuItems
      : user.role === 'school_admin'
      ? schoolAdminMenuItems
      : user.role === 'admin'
      ? adminMenuItems
      : teacherMenuItems;

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'My Profile',
      onClick: () => navigate('/profile')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={280}
        style={{
          background: 'linear-gradient(180deg, #001529 0%, #002140 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div
          style={{
            padding: '20px',
            color: 'white',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: '600',
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            whiteSpace: 'normal',
            wordWrap: 'break-word'
          }}
        >
          {!collapsed && <div style={{ marginBottom: '8px' }}>🎓 VidyaMark</div>}
          {!collapsed && user.role === 'main_admin' && <div style={{ fontSize: '13px', opacity: 0.8 }}>Main Admin</div>}
          {!collapsed && user.role !== 'main_admin' && school && <div style={{ fontSize: '13px', opacity: 0.8 }}>{school.name}</div>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ background: 'transparent', border: 'none' }}
        />
      </Sider>

      <Layout style={{ background: '#f0f2f5' }}>
        <Header
          style={{
            background: 'white',
            padding: '0 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', color: '#001529' }}
          />

          <Space size="large">
            {loading ? (
              <Spin size="small" />
            ) : user.role === 'main_admin' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Main Admin</div>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#001529' }}>
                    VidyaMark Platform
                  </div>
                </div>
              </div>
            ) : (
              school && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {user.role === 'school_admin' ? 'School Admin' : 'Teacher'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#001529' }}>
                      {school.name}
                    </div>
                  </div>
                </div>
              )
            )}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <Button type="text">
                <Avatar
                  size="small"
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                />
                <span style={{ marginLeft: '8px', color: '#001529' }}>
                  {user.firstName}
                </span>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: 'white',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default NavigationLayout;

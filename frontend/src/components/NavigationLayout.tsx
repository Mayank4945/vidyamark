import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import { LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const NavigationLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems: MenuProps['items'] = [
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
        width={250}
        style={{
          background: '#001529',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div
          style={{
            padding: '20px',
            color: 'white',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {!collapsed && '🎓 VidyaMark'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ background: '#001529' }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '18px' }}
          />

          <Space>
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
              <Button type="text">
                <Avatar
                  size="small"
                  style={{ backgroundColor: '#1890ff' }}
                  icon={<UserOutlined />}
                />
                <span style={{ marginLeft: '8px' }}>
                  {user.firstName} {user.lastName}
                </span>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: '#f5f5f5',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default NavigationLayout;

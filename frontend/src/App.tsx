import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import './App.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StudentManagement from './pages/StudentManagement';
import ExamManagement from './pages/ExamManagement';
import MarkEntry from './pages/MarkEntry';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Components
import NavigationLayout from './components/NavigationLayout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
        components: {
          Button: {
            controlHeight: 40,
          },
          Input: {
            controlHeight: 40,
          },
        },
      }}
    >
      <Router>
        <Routes>
          {/* Auth Routes (Public) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes with Navigation */}
          <Route element={<NavigationLayout />}>
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/students"
              element={
                <PrivateRoute>
                  <StudentManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/exams"
              element={
                <PrivateRoute>
                  <ExamManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/marks"
              element={
                <PrivateRoute>
                  <MarkEntry />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;

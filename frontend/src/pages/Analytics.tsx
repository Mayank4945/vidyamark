import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Empty,
  Spin,
  Alert,
  Table,
  Select,
  Row,
  Col,
  Button,
  Space,
  Statistic,
  Tag,
  Modal,
} from 'antd';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useParams } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface Student {
  student_id: number;
  first_name: string;
  last_name: string;
  roll_number: string;
  weighted_percentage: number;
  grade_letter: string;
  grade_point: number;
  total_exams_taken: number;
  total_exams_missed: number;
  calculation_details: any;
}

interface AcademicYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface AnalyticsData {
  classPerformance: Array<{ subject: string; average: number }>;
  studentRanking: Array<{ name: string; score: number; rank: number }>;
  subjectWisePerformance: Array<{ subject: string; percentage: number }>;
  performanceTrend: Array<{ month: string; average: number }>;
  studentGrades: Student[];
}

const getGradeColor = (grade: string) => {
  const colors: { [key: string]: string } = {
    A: '#52c41a',
    B: '#1890ff',
    C: '#faad14',
    D: '#f5222d',
    F: '#d9d9d9',
  };
  return colors[grade] || '#d9d9d9';
};

export default function Analytics() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<Partial<AnalyticsData>>({});
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recalculateModalVisible, setRecalculateModalVisible] = useState(false);

  const numClassId = classId ? parseInt(classId, 10) : 1;

  // Fetch academic years on mount
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const response = await api.getAcademicYears();
        const years = response.data?.data || [];
        setAcademicYears(years);

        // Set selected to active year, or first one
        const activeYear = years.find((ay: AcademicYear) => ay.is_active);
        if (activeYear) {
          setSelectedAcademicYear(activeYear.id);
        } else if (years.length > 0) {
          setSelectedAcademicYear(years[0].id);
        }
      } catch (err) {
        console.error('Error fetching academic years:', err);
      }
    };

    fetchAcademicYears();
  }, []);

  // Fetch analytics data when academic year changes
  useEffect(() => {
    if (!selectedAcademicYear) return;

    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch performance analytics
        const [performance, ranking, subject, trend, grades] = await Promise.all([
          api.getClassPerformance(numClassId),
          api.getStudentRanking(numClassId),
          api.getSubjectWisePerformance(numClassId),
          api.getPerformanceTrend(numClassId),
          api.getCalculatedGrades(numClassId, selectedAcademicYear),
        ]);

        setData({
          classPerformance: performance.data?.data || [],
          studentRanking: ranking.data?.data || [],
          subjectWisePerformance: subject.data?.data || [],
          performanceTrend: trend.data?.data || [],
          studentGrades: grades.data?.data || [],
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load analytics data');
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [selectedAcademicYear, numClassId]);

  const handleRecalculateGrades = async () => {
    if (!selectedAcademicYear) {
      console.error('Please select an academic year');
      return;
    }

    try {
      setGradesLoading(true);
      await api.calculateGrades(numClassId, selectedAcademicYear);
      
      // Refresh grades
      const gradesResponse = await api.getCalculatedGrades(numClassId, selectedAcademicYear);
      setData(prev => ({ ...prev, studentGrades: gradesResponse.data?.data || [] }));
      
      setRecalculateModalVisible(false);
      Modal.success({
        title: 'Success',
        content: 'Grades have been recalculated successfully',
      });
    } catch (err: any) {
      Modal.error({
        title: 'Error',
        content: err.response?.data?.error || 'Failed to recalculate grades',
      });
    } finally {
      setGradesLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading Analytics..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" />;
  }

  const studentGradesColumns = [
    {
      title: 'Roll No',
      dataIndex: 'roll_number',
      key: 'roll_number',
      width: 100,
    },
    {
      title: 'Student Name',
      dataIndex: ['first_name', 'last_name'],
      key: 'name',
      render: (_: any, record: Student) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Exams Taken',
      dataIndex: 'total_exams_taken',
      key: 'exams_taken',
      align: 'center' as const,
    },
    {
      title: 'Weighted %',
      dataIndex: 'weighted_percentage',
      key: 'weighted_percentage',
      align: 'right' as const,
      render: (percentage: number) => percentage ? `${percentage.toFixed(2)}%` : 'N/A',
      sorter: (a: Student, b: Student) => (a.weighted_percentage || 0) - (b.weighted_percentage || 0),
    },
    {
      title: 'Grade',
      dataIndex: 'grade_letter',
      key: 'grade_letter',
      align: 'center' as const,
      render: (grade: string) => (
        <Tag color={getGradeColor(grade)} style={{ fontSize: 14, padding: '4px 12px' }}>
          {grade}
        </Tag>
      ),
    },
    {
      title: 'GPA',
      dataIndex: 'grade_point',
      key: 'grade_point',
      align: 'center' as const,
      render: (point: number) => point ? `${point.toFixed(2)}` : 'N/A',
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header with Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Academic Year
              </label>
              <Select
                value={selectedAcademicYear}
                onChange={setSelectedAcademicYear}
                style={{ width: '100%' }}
                placeholder="Select Academic Year"
                options={academicYears.map((ay: AcademicYear) => ({
                  label: `${ay.name}${ay.is_active ? ' (Active)' : ''}`,
                  value: ay.id,
                }))}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={16} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setRecalculateModalVisible(true)}
                loading={gradesLoading}
              >
                Recalculate Grades
              </Button>
              <Button icon={<DownloadOutlined />} type="primary">
                Export Report
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Quick Stats */}
      {data.studentGrades && data.studentGrades.length > 0 && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Total Students"
              value={data.studentGrades.length}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Class Average"
              value={
                data.studentGrades.length > 0
                  ? (
                      data.studentGrades.reduce((sum, s) => sum + (s.weighted_percentage || 0), 0) /
                      data.studentGrades.length
                    ).toFixed(2)
                  : 0
              }
              suffix="%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Pass Rate"
              value={
                data.studentGrades.length > 0
                  ? (
                      (data.studentGrades.filter(s => s.weighted_percentage >= 55).length /
                        data.studentGrades.length) *
                      100
                    ).toFixed(2)
                  : 0
              }
              suffix="%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Top Grade"
              value={
                data.studentGrades.length > 0
                  ? data.studentGrades.reduce((max, s) => (s.grade_point || 0) > (max.grade_point || 0) ? s : max)
                      .grade_letter
                  : 'N/A'
              }
            />
          </Col>
        </Row>
      )}

      {/* Main Tabs */}
      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Student Grades',
            children: (
              <Card>
                {data.studentGrades && data.studentGrades.length > 0 ? (
                  <Table
                    dataSource={data.studentGrades}
                    columns={studentGradesColumns}
                    rowKey="student_id"
                    pagination={{ pageSize: 15 }}
                    scroll={{ x: 1000 }}
                  />
                ) : (
                  <Empty description="No grades calculated. Please recalculate grades." />
                )}
              </Card>
            ),
          },
          {
            key: '2',
            label: 'Subject Performance',
            children: (
              <Card title="Subject-wise Average Marks">
                {data.classPerformance && data.classPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.classPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="average" fill="#1890ff" name="Average Marks" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" />
                )}
              </Card>
            ),
          },
          {
            key: '3',
            label: 'Performance Trend',
            children: (
              <Card title="Performance Trend Over Exams">
                {data.performanceTrend && data.performanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.performanceTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#52c41a"
                        name="Average Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" />
                )}
              </Card>
            ),
          },
          {
            key: '4',
            label: 'Grade Distribution',
            children: (
              <Card title="Grade Distribution">
                {data.studentGrades && data.studentGrades.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={
                          Object.entries(
                            data.studentGrades.reduce((acc: any, s) => {
                              const grade = s.grade_letter || 'N/A';
                              acc[grade] = (acc[grade] || 0) + 1;
                              return acc;
                            }, {})
                          ).map(([name, value]) => ({ name, value }))
                        }
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {Object.keys(
                          data.studentGrades.reduce((acc: any, s) => {
                            const grade = s.grade_letter || 'N/A';
                            acc[grade] = true;
                            return acc;
                          }, {})
                        ).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" />
                )}
              </Card>
            ),
          },
        ]}
      />

      {/* Recalculate Modal */}
      <Modal
        title="Recalculate Grades"
        open={recalculateModalVisible}
        onOk={handleRecalculateGrades}
        onCancel={() => setRecalculateModalVisible(false)}
        confirmLoading={gradesLoading}
        okText="Recalculate"
      >
        <p>
          This will recalculate weighted grades for all students in this class for the selected academic year based on the school's grading policy.
        </p>
        <p>
          <strong>Note:</strong> Existing grade records will be updated.
        </p>
      </Modal>
    </div>
  );
}

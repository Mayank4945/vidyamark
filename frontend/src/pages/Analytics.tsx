import React, { useEffect, useState } from 'react';
import { Card, Tabs, Empty, Spin, Alert, Row, Col, Table } from 'antd';
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
import api from '../services/api';
import { useParams } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface AnalyticsData {
  classPerformance: Array<{ subject: string; average: number }>;
  studentRanking: Array<{ name: string; score: number; rank: number }>;
  subjectWisePerformance: Array<{ subject: string; percentage: number }>;
  performanceTrend: Array<{ month: string; average: number }>;
}

export default function Analytics() {
  const { classId } = useParams<{ classId: string }>();
  const [data, setData] = useState<Partial<AnalyticsData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const numClassId = classId ? parseInt(classId, 10) : 1;

        const [performance, ranking, subject, trend] = await Promise.all([
          api.getClassPerformance(numClassId),
          api.getStudentRanking(numClassId),
          api.getSubjectWisePerformance(numClassId),
          api.getPerformanceTrend(numClassId),
        ]);

        setData({
          classPerformance: performance.data,
          studentRanking: ranking.data,
          subjectWisePerformance: subject.data,
          performanceTrend: trend.data,
        });
      } catch (err) {
        setError('Failed to load analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [classId]);

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

  const studentColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Student Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      align: 'right' as const,
      render: (score: number) => `${score}%`,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={`Analytics Dashboard - Class ${classId}`}
        style={{ marginBottom: '24px' }}
      >
        <p>Comprehensive performance analytics for your class</p>
      </Card>

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Overview',
            children: (
              <Card title="Class Performance by Subject">
                {data.classPerformance && data.classPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.classPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="average"
                        fill="#8884d8"
                        name="Average Score"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No data available" />
                )}
              </Card>
            ),
          },
          {
            key: '2',
            label: 'Subjects',
            children: (
              <Card title="Subject-wise Performance Distribution">
                {data.subjectWisePerformance &&
                data.subjectWisePerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.subjectWisePerformance}
                        dataKey="percentage"
                        nameKey="subject"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {data.subjectWisePerformance.map(
                          (_entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          )
                        )}
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
          {
            key: '3',
            label: 'Student Ranking',
            children: (
              <Card title="Student Ranking">
                {data.studentRanking && data.studentRanking.length > 0 ? (
                  <Table
                    dataSource={data.studentRanking}
                    columns={studentColumns}
                    rowKey="rank"
                    pagination={false}
                  />
                ) : (
                  <Empty description="No data available" />
                )}
              </Card>
            ),
          },
          {
            key: '4',
            label: 'Performance Trend',
            children: (
              <Card title="Performance Trend Over Time">
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
                        stroke="#8884d8"
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
        ]}
      />
    </div>
  );
}

import React from 'react';
import { Table, Button, Space, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface StudentRecord {
  id: number;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentContact?: string;
}

interface StudentTableProps {
  students: StudentRecord[];
  loading: boolean;
  onEdit?: (student: StudentRecord) => void;
  onDelete?: (studentId: number) => void;
  onDownload?: () => void;
}

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  loading,
  onEdit,
  onDelete,
  onDownload,
}) => {
  const columns: ColumnsType<StudentRecord> = [
    {
      title: 'Roll No',
      dataIndex: 'rollNumber',
      key: 'rollNumber',
      width: 100,
      sorter: (a, b) => a.rollNumber.localeCompare(b.rollNumber),
    },
    {
      title: 'Student Name',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => email || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-',
    },
    {
      title: 'Parent Name',
      dataIndex: 'parentName',
      key: 'parentName',
      render: (parentName) => parentName || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {onEdit && (
            <Tooltip title="Edit">
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this student?')) {
                    onDelete(record.id);
                  }
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {onDownload && (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={onDownload}
          >
            Download as Excel
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={students.map((s) => ({ ...s, key: s.id }))}
        loading={loading}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default StudentTable;

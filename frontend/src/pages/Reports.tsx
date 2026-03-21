import React from 'react';
import { Card, Empty, Button } from 'antd';

const Reports: React.FC = () => {
  return (
    <Card title="Reports & Analytics">
      <Empty
        description="Reports Feature Coming Soon"
        style={{ marginTop: '50px' }}
      >
        <Button type="primary">Learn More</Button>
      </Empty>
    </Card>
  );
};

export default Reports;

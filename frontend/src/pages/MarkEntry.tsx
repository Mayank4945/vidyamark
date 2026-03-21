import React from 'react';
import { Card, Empty, Button } from 'antd';

const MarkEntry: React.FC = () => {
  return (
    <Card title="Mark Entry">
      <Empty
        description="Mark Entry Feature Coming Soon"
        style={{ marginTop: '50px' }}
      >
        <Button type="primary">Learn More</Button>
      </Empty>
    </Card>
  );
};

export default MarkEntry;

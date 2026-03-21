import React from 'react';
import { Card, Empty, Button } from 'antd';

const Settings: React.FC = () => {
  return (
    <Card title="Settings">
      <Empty
        description="Settings Feature Coming Soon"
        style={{ marginTop: '50px' }}
      >
        <Button type="primary">Learn More</Button>
      </Empty>
    </Card>
  );
};

export default Settings;

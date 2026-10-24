import React from 'react';
import { UserManagement } from '../components/UserManagement';

export const AccountManagementPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <UserManagement />
    </div>
  );
};

export default AccountManagementPage;

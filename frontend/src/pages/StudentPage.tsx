import React from 'react';
import { StudentList } from '../components/StudentList';

export const StudentPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <StudentList />
    </div>
  );
};

export default StudentPage;

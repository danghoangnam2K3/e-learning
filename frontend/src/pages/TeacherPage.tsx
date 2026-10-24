import React from 'react';
import { TeacherList } from '../components/TeacherList';

export const TeacherPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <TeacherList />
    </div>
  );
};

export default TeacherPage;

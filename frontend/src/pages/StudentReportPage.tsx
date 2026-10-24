import React from 'react';
import { StudentProgressReportView } from '../components/StudentProgressReportView';

export const StudentReportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <StudentProgressReportView />
    </div>
  );
};

export default StudentReportPage;

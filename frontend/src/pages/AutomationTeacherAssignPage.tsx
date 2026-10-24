import React from 'react';
import { AutomationTeacherAssign } from '../components/AutomationTeacherAssign';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const AutomationTeacherAssignPage: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Không thể tải trang Phân công giáo viên">
      <div className="space-y-6">
        <AutomationTeacherAssign />
      </div>
    </ErrorBoundary>
  );
};

export default AutomationTeacherAssignPage;


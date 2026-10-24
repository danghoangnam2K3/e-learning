import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AutomationReport1 } from '../components/AutomationReport1';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const AutomationReport1Page: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary fallbackTitle="Không thể tải trang Báo cáo 1">
      <div className="space-y-6">
        <AutomationReport1
          onNavigateToCourses={() => navigate('/khoahoc')}
          onNavigateToStudents={() => navigate('/hocvien')}
          onNavigateToLessons={(courseId) => {
            navigate(`/baigiang${courseId ? `?courseId=${courseId}` : ''}`);
          }}
        />
      </div>
    </ErrorBoundary>
  );
};

export default AutomationReport1Page;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CourseList } from '../components/CourseList';

export const CourseListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <CourseList
        onNavigateToLessons={(courseId) => {
          navigate(`/baigiang${courseId ? `?courseId=${courseId}` : ''}`);
        }}
        onNavigateToReport1={() => {
          navigate('/tudonghoa/baocao1');
        }}
        onNavigateToStudents={() => {
          navigate('/hocvien');
        }}
      />
    </div>
  );
};

export default CourseListPage;

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { LessonManagement } from '../components/LessonManagement';

export const LessonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get('courseId');
  const initialCourseId = courseIdParam ? parseInt(courseIdParam, 10) : undefined;

  return (
    <div className="space-y-6">
      <LessonManagement initialCourseId={initialCourseId} />
    </div>
  );
};

export default LessonPage;

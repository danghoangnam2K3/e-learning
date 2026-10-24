import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardOverview } from '../components/DashboardOverview';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (tab: string, subTab?: string) => {
    switch (tab) {
      case 'students':
        navigate('/hocvien');
        break;
      case 'teachers':
        navigate('/giaovien');
        break;
      case 'courses':
        if (subTab === 'lessons') navigate('/baigiang');
        else navigate('/khoahoc');
        break;
      case 'automation':
        if (subTab === 'assign') navigate('/tudonghoa/phancong');
        else navigate('/tudonghoa/baocao1');
        break;
      case 'reports':
        if (subTab === 'student-report') navigate('/baocao/hocvien');
        else navigate('/baocao/khoahoc');
        break;
      default:
        navigate('/');
    }
  };

  return <DashboardOverview onNavigate={handleNavigate} />;
};

export default DashboardPage;

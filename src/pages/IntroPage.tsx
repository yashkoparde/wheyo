import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IntroSequence } from '../components/IntroSequence';

export default function IntroPage() {
  const navigate = useNavigate();

  const handleComplete = () => {
    localStorage.setItem('has_completed_intro', 'true');
    if (!localStorage.getItem('user_segment')) {
      localStorage.setItem('user_segment', 'student');
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] overflow-hidden">
      <IntroSequence onComplete={handleComplete} />
    </div>
  );
}

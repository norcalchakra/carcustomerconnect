import React from 'react';
import { Link } from 'react-router-dom';
import './FlashingButton.css';

interface FlashingButtonProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

const FlashingButton: React.FC<FlashingButtonProps> = ({ to, children, className = '' }) => {
  return (
    <Link
      to={to}
      className={`
        inline-block px-8 py-4 text-xl font-bold text-white
        bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500
        rounded-lg shadow-2xl transform transition-all duration-300
        hover:scale-110 hover:shadow-3xl
        animate-pulse
        comic-panel comic-panel-primary
        ${className}
      `}
      style={{
        animation: 'flash 1.5s infinite alternate, bounce 2s infinite',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
        boxShadow: '0 0 20px rgba(255, 165, 0, 0.6), 0 0 40px rgba(255, 165, 0, 0.4), 0 0 60px rgba(255, 165, 0, 0.2)'
      }}
    >
      {children}
    </Link>
  );
};

export default FlashingButton;

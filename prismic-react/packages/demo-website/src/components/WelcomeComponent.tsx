import React from 'react';

interface WelcomeProps {
  title?: string;
  subtitle?: string;
}

export const WelcomeComponent: React.FC<WelcomeProps> = ({ 
  title = "Welcome to Prismic React", 
  subtitle = "A React adaptation of the Web Prism framework" 
}) => {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      backgroundColor: '#f0f0f0', 
      borderRadius: '8px',
      margin: '1rem'
    }}>
      <h1 style={{ color: '#333', marginBottom: '0.5rem' }}>{title}</h1>
      <p style={{ color: '#666', fontSize: '1.1rem' }}>{subtitle}</p>
      <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '1rem' }}>
        This component was rendered in the 'welcome' region using React Portals
      </p>
    </div>
  );
};

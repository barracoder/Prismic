import React, { useState } from 'react';

interface CounterProps {
  initialValue?: number;
  step?: number;
}

export const CounterComponent: React.FC<CounterProps> = ({ 
  initialValue = 0, 
  step = 1 
}) => {
  const [count, setCount] = useState(initialValue);

  return (
    <div style={{ 
      padding: '1.5rem', 
      border: '2px solid #007acc', 
      borderRadius: '8px',
      textAlign: 'center',
      margin: '1rem',
      backgroundColor: '#fff'
    }}>
      <h3 style={{ color: '#007acc', marginBottom: '1rem' }}>Interactive Counter</h3>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>
        {count}
      </div>
      <div>
        <button 
          onClick={() => setCount(count - step)}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          -
        </button>
        <button 
          onClick={() => setCount(count + step)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          +
        </button>
      </div>
      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '1rem' }}>
        This component demonstrates stateful React components in regions
      </p>
    </div>
  );
};

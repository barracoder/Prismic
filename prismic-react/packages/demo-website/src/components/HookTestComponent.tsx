import React from 'react';
import { useContainer, useEventAggregator, useRegionManager } from 'prismic-react';

/**
 * Test component to demonstrate the framework hooks
 */
export const HookTestComponent: React.FC = () => {
  // Always call hooks at the top level
  const container = useContainer();
  const eventAggregator = useEventAggregator();
  const regionManager = useRegionManager();

  return (
    <div style={{ 
      padding: '1rem', 
      border: '1px solid #ddd', 
      borderRadius: '4px', 
      margin: '1rem 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h4>🔗 Framework Hooks Status</h4>
      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
        <li>✅ Container: {container ? 'Available' : 'Not available'}</li>
        <li>✅ Event Aggregator: {eventAggregator ? 'Available' : 'Not available'}</li>
        <li>✅ Region Manager: {regionManager ? `Available (${regionManager.getRegionNames().length} regions)` : 'Not available'}</li>
      </ul>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
        All framework services are now accessible via hooks!
      </p>
    </div>
  );
};

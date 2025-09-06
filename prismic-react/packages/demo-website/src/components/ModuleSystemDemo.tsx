import React, { useState } from 'react';

interface ModuleInfo {
  name: string;
  status: 'available' | 'loading' | 'loaded' | 'error';
  description: string;
  features: string[];
}

export const ModuleSystemDemo: React.FC = () => {
  const [modules] = useState<ModuleInfo[]>([
    {
      name: 'UploadLogsModule',
      status: 'loaded',
      description: 'Dashboard module for managing upload logs and tracking file operations',
      features: ['File upload tracking', 'Progress monitoring', 'Error handling', 'Bulk operations']
    },
    {
      name: 'AnalyticsModule',
      status: 'available',
      description: 'Advanced analytics and reporting capabilities for upload metrics',
      features: ['Usage statistics', 'Performance metrics', 'Custom reports', 'Data visualization']
    },
    {
      name: 'NotificationsModule',
      status: 'loaded',
      description: 'Real-time notification system for upload events and alerts',
      features: ['Real-time alerts', 'Email notifications', 'Custom triggers', 'Event filtering']
    },
    {
      name: 'UserManagementModule',
      status: 'available',
      description: 'User management and permissions system',
      features: ['User authentication', 'Role-based access', 'Permission management', 'Activity logging']
    }
  ]);

  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const getStatusIcon = (status: ModuleInfo['status']) => {
    switch (status) {
      case 'loaded':
        return '✅';
      case 'loading':
        return '⏳';
      case 'available':
        return '📦';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusText = (status: ModuleInfo['status']) => {
    switch (status) {
      case 'loaded':
        return 'Loaded';
      case 'loading':
        return 'Loading...';
      case 'available':
        return 'Available';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const handleLoadModule = (moduleName: string) => {
    // Simulate module loading (in real implementation this would use the module manager)
    console.log(`Loading module: ${moduleName}`);
    
    // In real implementation:
    // await moduleManager.loadModule(moduleName);
  };

  const selectedModuleInfo = modules.find(m => m.name === selectedModule);

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3>Module System Dashboard</h3>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        This demonstrates the modular architecture. Each module can be loaded dynamically and contribute UI, commands, and functionality.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <h4>Available Modules</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {modules.map(module => (
              <div
                key={module.name}
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedModule === module.name ? '#f0f8ff' : '#fff',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => setSelectedModule(module.name)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(module.status)}</span>
                  <span style={{ fontWeight: 'bold' }}>{module.name}</span>
                  <span style={{ 
                    marginLeft: 'auto', 
                    fontSize: '0.8rem', 
                    color: module.status === 'loaded' ? 'green' : '#666'
                  }}>
                    {getStatusText(module.status)}
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  {module.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4>Module Details</h4>
          {selectedModuleInfo ? (
            <div style={{ 
              padding: '1rem', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: '#f9f9f9'
            }}>
              <h5 style={{ margin: '0 0 0.5rem 0' }}>{selectedModuleInfo.name}</h5>
              <p style={{ margin: '0 0 1rem 0', color: '#666' }}>
                {selectedModuleInfo.description}
              </p>
              
              <h6 style={{ margin: '0 0 0.5rem 0' }}>Features:</h6>
              <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
                {selectedModuleInfo.features.map(feature => (
                  <li key={feature} style={{ fontSize: '0.9rem' }}>{feature}</li>
                ))}
              </ul>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedModuleInfo.status === 'available' && (
                  <button
                    onClick={() => handleLoadModule(selectedModuleInfo.name)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Load Module
                  </button>
                )}
                {selectedModuleInfo.status === 'loaded' && (
                  <span style={{ 
                    padding: '0.5rem 1rem',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    ✓ Module Active
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '1rem', 
              border: '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: '#f9f9f9',
              color: '#666',
              textAlign: 'center'
            }}>
              Select a module to view details
            </div>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#e8f4f8', borderRadius: '4px' }}>
        <h5 style={{ margin: '0 0 0.5rem 0' }}>Module System Features:</h5>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          <div>✅ Dynamic loading</div>
          <div>✅ Dependency resolution</div>
          <div>✅ UI contributions</div>
          <div>✅ Command registration</div>
          <div>✅ Context-sensitive behavior</div>
          <div>✅ Lifecycle management</div>
        </div>
      </div>
    </div>
  );
};

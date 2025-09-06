import React, { useEffect, useState } from 'react';
import {
  Container,
  EventAggregator,
  RegionManager,
  ReactModuleManager,
  CommandManager,
  ModuleProvider,
  ModuleLoader,
  DashboardShell,
  DashboardCommands,
  ModuleCatalogLoader,
  DashboardModuleCatalog,
  DashboardContext,
  UploadLogEntry
} from '../src/index';

/**
 * Complete example of a dashboard application with dynamic module loading
 */
export const DashboardApp: React.FC = () => {
  const [container] = useState(() => new Container());
  const [eventAggregator] = useState(() => new EventAggregator());
  const [regionManager] = useState(() => new RegionManager());
  const [moduleManager, setModuleManager] = useState<ReactModuleManager | null>(null);
  const [commandManager] = useState(() => new CommandManager());
  const [dashboardContext, setDashboardContext] = useState<DashboardContext>({});
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    initializeApplication();
  }, []);
  
  const initializeApplication = async () => {
    try {
      // Create module manager
      const moduleManager = new ReactModuleManager({
        container,
        eventAggregator,
        regionManager
      });
      
      // Load module catalog
      const catalog = DashboardModuleCatalog.createBasicCatalog();
      
      // Register modules from catalog
      moduleManager.registerModules(catalog.modules);
      
      // Register standard dashboard commands
      const standardCommands = DashboardCommands.createStandardCommands();
      standardCommands.forEach(command => commandManager.registerCommand(command));
      
      // Set up core services
      container.registerInstance('moduleManager', moduleManager);
      container.registerInstance('commandManager', commandManager);
      
      setModuleManager(moduleManager);
      setIsInitialized(true);
      
      console.log('Dashboard application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize dashboard application:', error);
    }
  };
  
  const updateDashboardContext = (updates: Partial<DashboardContext>) => {
    setDashboardContext(prev => ({ ...prev, ...updates }));
  };
  
  const selectUpload = (upload: UploadLogEntry) => {
    updateDashboardContext({ selectedUpload: upload });
  };
  
  const selectLogs = (logs: UploadLogEntry[]) => {
    updateDashboardContext({ selectedLogs: logs });
  };
  
  if (!isInitialized || !moduleManager) {
    return <div>Initializing dashboard...</div>;
  }
  
  return (
    <ModuleProvider
      moduleManager={moduleManager}
      commandManager={commandManager}
      dashboardContext={dashboardContext}
    >
      <ModuleLoader autoLoadAll fallback={ErrorFallback}>
        <DashboardShell>
          <MainContent
            onSelectUpload={selectUpload}
            onSelectLogs={selectLogs}
          />
        </DashboardShell>
      </ModuleLoader>
    </ModuleProvider>
  );
};

/**
 * Main content area of the dashboard
 */
interface MainContentProps {
  onSelectUpload: (upload: UploadLogEntry) => void;
  onSelectLogs: (logs: UploadLogEntry[]) => void;
}

const MainContent: React.FC<MainContentProps> = ({ onSelectUpload, onSelectLogs }) => {
  const [uploads] = useState<UploadLogEntry[]>([
    {
      id: '1',
      fileName: 'document1.pdf',
      fileSize: 1024000,
      uploadTime: new Date(Date.now() - 3600000),
      status: 'completed',
      progress: 100
    },
    {
      id: '2',
      fileName: 'image.jpg',
      fileSize: 512000,
      uploadTime: new Date(Date.now() - 1800000),
      status: 'failed',
      error: 'Network timeout'
    },
    {
      id: '3',
      fileName: 'data.csv',
      fileSize: 256000,
      uploadTime: new Date(Date.now() - 900000),
      status: 'uploading',
      progress: 75
    }
  ]);
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const handleSelectUpload = (upload: UploadLogEntry) => {
    onSelectUpload(upload);
    setSelectedIds([upload.id]);
  };
  
  const handleSelectMultiple = (ids: string[]) => {
    const selectedUploads = uploads.filter(upload => ids.includes(upload.id));
    onSelectLogs(selectedUploads);
    setSelectedIds(ids);
  };
  
  return (
    <div className="main-content">
      <h1>Upload Dashboard</h1>
      
      <div className="upload-list">
        <h2>Recent Uploads</h2>
        {uploads.map(upload => (
          <div
            key={upload.id}
            className={`upload-item ${selectedIds.includes(upload.id) ? 'selected' : ''}`}
            onClick={() => handleSelectUpload(upload)}
          >
            <div className="upload-info">
              <div className="file-name">{upload.fileName}</div>
              <div className="file-size">{formatFileSize(upload.fileSize)}</div>
              <div className={`status status-${upload.status}`}>
                {upload.status.toUpperCase()}
              </div>
            </div>
            
            {upload.status === 'uploading' && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            )}
            
            {upload.error && (
              <div className="error-message">{upload.error}</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="actions">
        <button onClick={() => handleSelectMultiple(uploads.map(u => u.id))}>
          Select All
        </button>
        <button onClick={() => handleSelectMultiple([])}>
          Clear Selection
        </button>
      </div>
    </div>
  );
};

/**
 * Error fallback component for module loading failures
 */
const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => {
  return (
    <div className="error-fallback">
      <h2>Failed to load modules</h2>
      {error && (
        <details>
          <summary>Error details</summary>
          <pre>{error.message}</pre>
        </details>
      )}
      <button onClick={() => window.location.reload()}>
        Reload Application
      </button>
    </div>
  );
};

/**
 * Utility function to format file sizes
 */
const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Example of programmatic module loading
 */
export const ModuleManagementExample: React.FC = () => {
  const [moduleManager] = useState(() => {
    const container = new Container();
    const eventAggregator = new EventAggregator();
    const regionManager = new RegionManager();
    
    return new ReactModuleManager({
      container,
      eventAggregator,
      regionManager
    });
  });
  
  const [loadedModules, setLoadedModules] = useState<string[]>([]);
  
  useEffect(() => {
    // Load basic catalog
    const catalog = DashboardModuleCatalog.createBasicCatalog();
    moduleManager.registerModules(catalog.modules);
    
    // Listen for module state changes
    const unsubscribe = moduleManager.addStateChangeListener((moduleName, state) => {
      console.log(`Module ${moduleName} state changed to: ${state}`);
      if (state === 'loaded') {
        setLoadedModules(prev => [...prev, moduleName]);
      }
    });
    
    return unsubscribe;
  }, [moduleManager]);
  
  const loadModule = async (moduleName: string) => {
    try {
      await moduleManager.loadModule(moduleName);
      console.log(`Successfully loaded module: ${moduleName}`);
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
    }
  };
  
  const unloadModule = async (moduleName: string) => {
    try {
      await moduleManager.unloadModule(moduleName);
      setLoadedModules(prev => prev.filter(name => name !== moduleName));
      console.log(`Successfully unloaded module: ${moduleName}`);
    } catch (error) {
      console.error(`Failed to unload module ${moduleName}:`, error);
    }
  };
  
  const availableModules = [
    'CoreDashboardModule',
    'UploadLogsModule',
    'AnalyticsModule',
    'UserManagementModule',
    'SettingsModule',
    'NotificationsModule'
  ];
  
  return (
    <div className="module-management">
      <h2>Module Management</h2>
      
      <div className="module-list">
        {availableModules.map(moduleName => {
          const isLoaded = loadedModules.includes(moduleName);
          const moduleInfo = moduleManager.getModuleInfo(moduleName);
          
          return (
            <div key={moduleName} className="module-item">
              <div className="module-info">
                <span className="module-name">{moduleName}</span>
                <span className={`module-status status-${moduleInfo?.state || 'not-loaded'}`}>
                  {moduleInfo?.state || 'not-loaded'}
                </span>
              </div>
              
              <div className="module-actions">
                {!isLoaded ? (
                  <button onClick={() => loadModule(moduleName)}>
                    Load
                  </button>
                ) : (
                  <button onClick={() => unloadModule(moduleName)}>
                    Unload
                  </button>
                )}
              </div>
              
              {moduleInfo?.error && (
                <div className="module-error">
                  Error: {moduleInfo.error.message}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="bulk-actions">
        <button onClick={() => moduleManager.loadAllModules()}>
          Load All Auto-Load Modules
        </button>
      </div>
    </div>
  );
};

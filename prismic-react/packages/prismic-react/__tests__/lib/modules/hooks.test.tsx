import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { 
  useModuleManager, 
  useCommandManager, 
  useDashboardContext,
  useUIContributions,
  useCommands,
  useCommandExecutor,
  useModuleState,
  useModuleLoader,
  ModuleProvider,
  ModuleLoader
} from '../../../src/lib/modules/hooks';
import { ReactModuleManager } from '../../../src/lib/modules/module-manager';
import { CommandManager } from '../../../src/lib/modules/commands';
import { Container } from '../../../src/lib/core/container';
import { EventAggregator } from '../../../src/lib/core/event-aggregator';
import { RegionManager } from '../../../src/lib/core/regions';

// Test components
const TestComponent: React.FC = () => {
  const moduleManager = useModuleManager();
  const commandManager = useCommandManager();
  const dashboardContext = useDashboardContext();
  
  return (
    <div>
      <div data-testid="module-manager">{moduleManager ? 'present' : 'missing'}</div>
      <div data-testid="command-manager">{commandManager ? 'present' : 'missing'}</div>
      <div data-testid="dashboard-context">{JSON.stringify(dashboardContext)}</div>
    </div>
  );
};

const UIContributionsComponent: React.FC = () => {
  const contributions = useUIContributions();
  
  return (
    <div>
      <div data-testid="sidebars-count">{contributions.sidebars?.length || 0}</div>
      <div data-testid="toolbar-items-count">{contributions.toolbarItems?.length || 0}</div>
    </div>
  );
};

const CommandsComponent: React.FC = () => {
  const commands = useCommands();
  const { executeCommand, canExecuteCommand } = useCommandExecutor();
  
  return (
    <div>
      <div data-testid="commands-count">{Object.keys(commands).length}</div>
      <button 
        data-testid="execute-test-command"
        onClick={() => executeCommand('test.command')}
        disabled={!canExecuteCommand('test.command')}
      >
        Execute Test Command
      </button>
    </div>
  );
};

const ModuleStateComponent: React.FC<{ moduleName?: string }> = ({ moduleName }) => {
  const moduleState = useModuleState(moduleName);
  
  return (
    <div>
      <div data-testid="module-state">{JSON.stringify(moduleState)}</div>
    </div>
  );
};

const ModuleLoaderComponent: React.FC = () => {
  const { loadModule, unloadModule, isLoading } = useModuleLoader();
  
  return (
    <div>
      <button 
        data-testid="load-module"
        onClick={() => loadModule('TestModule')}
        disabled={isLoading('TestModule')}
      >
        Load Module
      </button>
      <button 
        data-testid="unload-module"
        onClick={() => unloadModule('TestModule')}
      >
        Unload Module
      </button>
      <div data-testid="loading-state">{isLoading('TestModule') ? 'loading' : 'idle'}</div>
    </div>
  );
};

describe('Module Hooks', () => {
  let moduleManager: ReactModuleManager;
  let commandManager: CommandManager;
  let container: Container;
  let eventAggregator: EventAggregator;
  let regionManager: RegionManager;
  
  beforeEach(() => {
    container = new Container();
    eventAggregator = new EventAggregator();
    regionManager = new RegionManager();
    
    moduleManager = new ReactModuleManager({
      container,
      eventAggregator,
      regionManager
    });
    
    commandManager = new CommandManager();
  });
  
  describe('useModuleManager', () => {
    it('should provide module manager from context', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <TestComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('module-manager')).toHaveTextContent('present');
    });
    
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useModuleManager must be used within a ModuleProvider');
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('useCommandManager', () => {
    it('should provide command manager from context', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <TestComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('command-manager')).toHaveTextContent('present');
    });
    
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useCommandManager must be used within a ModuleProvider');
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('useDashboardContext', () => {
    it('should provide dashboard context', () => {
      const dashboardContext = { user: { id: '1', name: 'Test User' } };
      
      render(
        <ModuleProvider 
          moduleManager={moduleManager} 
          commandManager={commandManager}
          dashboardContext={dashboardContext}
        >
          <TestComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('dashboard-context')).toHaveTextContent(
        JSON.stringify(dashboardContext)
      );
    });
    
    it('should provide empty context by default', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <TestComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('dashboard-context')).toHaveTextContent('{}');
    });
  });
  
  describe('useUIContributions', () => {
    it('should return empty contributions when no modules loaded', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <UIContributionsComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('sidebars-count')).toHaveTextContent('0');
      expect(screen.getByTestId('toolbar-items-count')).toHaveTextContent('0');
    });
    
    // Note: Testing with loaded modules would require mocking the module loading system
    // which is complex in this context. Integration tests would be better for this.
  });
  
  describe('useCommands', () => {
    it('should return empty commands when no modules loaded', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <CommandsComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('commands-count')).toHaveTextContent('0');
    });
  });
  
  describe('useCommandExecutor', () => {
    it('should disable command execution for non-existent commands', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <CommandsComponent />
        </ModuleProvider>
      );
      
      const button = screen.getByTestId('execute-test-command');
      expect(button).toBeDisabled();
    });
  });
  
  describe('useModuleState', () => {
    it('should return null for non-existent module', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <ModuleStateComponent moduleName="NonExistentModule" />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('module-state')).toHaveTextContent('null');
    });
    
    it('should return all module states when no module name provided', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <ModuleStateComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('module-state')).toHaveTextContent('{}');
    });
  });
  
  describe('useModuleLoader', () => {
    it('should provide module loading functions', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <ModuleLoaderComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('load-module')).toBeInTheDocument();
      expect(screen.getByTestId('unload-module')).toBeInTheDocument();
      expect(screen.getByTestId('loading-state')).toHaveTextContent('idle');
    });
  });
  
  describe('ModuleProvider', () => {
    it('should update command manager context when dashboard context changes', () => {
      const { rerender } = render(
        <ModuleProvider 
          moduleManager={moduleManager} 
          commandManager={commandManager}
          dashboardContext={{ user: 'initial' }}
        >
          <TestComponent />
        </ModuleProvider>
      );
      
      // Update the context
      rerender(
        <ModuleProvider 
          moduleManager={moduleManager} 
          commandManager={commandManager}
          dashboardContext={{ user: 'updated' }}
        >
          <TestComponent />
        </ModuleProvider>
      );
      
      expect(screen.getByTestId('dashboard-context')).toHaveTextContent(
        JSON.stringify({ user: 'updated' })
      );
    });
  });
  
  describe('ModuleLoader', () => {
    it('should show loading state initially', () => {
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <ModuleLoader>
            <div data-testid="children">Content</div>
          </ModuleLoader>
        </ModuleProvider>
      );
      
      expect(screen.getByText('Loading modules...')).toBeInTheDocument();
    });
    
    it('should show children after loading completes', async () => {
      // Mock successful loading
      jest.spyOn(moduleManager, 'loadAllModules').mockResolvedValue();
      
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <ModuleLoader autoLoadAll>
            <div data-testid="children">Content</div>
          </ModuleLoader>
        </ModuleProvider>
      );
      
      // Wait for loading to complete
      await screen.findByTestId('children');
      expect(screen.getByTestId('children')).toHaveTextContent('Content');
    });
    
    it('should show error fallback on loading failure', async () => {
      const error = new Error('Loading failed');
      jest.spyOn(moduleManager, 'loadAllModules').mockRejectedValue(error);
      
      const ErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
        <div data-testid="error-fallback">{error?.message}</div>
      );
      
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <ModuleLoader autoLoadAll fallback={ErrorFallback}>
            <div data-testid="children">Content</div>
          </ModuleLoader>
        </ModuleProvider>
      );
      
      await screen.findByTestId('error-fallback');
      expect(screen.getByTestId('error-fallback')).toHaveTextContent('Loading failed');
    });
    
    it('should load specific modules when provided', async () => {
      const loadModuleSpy = jest.spyOn(moduleManager, 'loadModule').mockResolvedValue();
      
      render(
        <ModuleProvider moduleManager={moduleManager} commandManager={commandManager}>
          <ModuleLoader modules={['Module1', 'Module2']}>
            <div data-testid="children">Content</div>
          </ModuleLoader>
        </ModuleProvider>
      );
      
      await screen.findByTestId('children');
      
      expect(loadModuleSpy).toHaveBeenCalledWith('Module1');
      expect(loadModuleSpy).toHaveBeenCalledWith('Module2');
    });
  });
});

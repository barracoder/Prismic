import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  IModuleManager, 
  ModuleConfig, 
  ModuleInfo, 
  ModuleState,
  UIContributions,
  ICommand,
  DashboardContext
} from './interfaces';
import { CommandManager, ContextEvaluator } from './commands';

/**
 * Context for module manager
 */
const ModuleManagerContext = createContext<IModuleManager | null>(null);

/**
 * Context for command manager
 */
const CommandManagerContext = createContext<CommandManager | null>(null);

/**
 * Context for dashboard state
 */
const DashboardContext = createContext<DashboardContext>({});

/**
 * Hook to access module manager
 */
export function useModuleManager(): IModuleManager {
  const manager = useContext(ModuleManagerContext);
  if (!manager) {
    throw new Error('useModuleManager must be used within a ModuleProvider');
  }
  return manager;
}

/**
 * Hook to access command manager
 */
export function useCommandManager(): CommandManager {
  const manager = useContext(CommandManagerContext);
  if (!manager) {
    throw new Error('useCommandManager must be used within a ModuleProvider');
  }
  return manager;
}

/**
 * Hook to access dashboard context
 */
export function useDashboardContext(): DashboardContext {
  return useContext(DashboardContext);
}

/**
 * Hook to get UI contributions with context filtering
 */
export function useUIContributions(): UIContributions {
  const moduleManager = useModuleManager();
  const dashboardContext = useDashboardContext();
  
  return useMemo(() => {
    const contributions = moduleManager.getUIContributions();
    
    // Filter contributions based on context conditions
    const filtered: UIContributions = {
      sidebars: contributions.sidebars?.filter(sidebar => 
        ContextEvaluator.evaluateConditions(sidebar.context || [], dashboardContext)
      ),
      menuItems: contributions.menuItems?.filter(item => 
        ContextEvaluator.evaluateConditions(item.context || [], dashboardContext)
      ),
      toolbarItems: contributions.toolbarItems?.filter(item => 
        ContextEvaluator.evaluateConditions(item.context || [], dashboardContext)
      ),
      statusBarItems: contributions.statusBarItems?.filter(item => 
        ContextEvaluator.evaluateConditions(item.context || [], dashboardContext)
      ),
      contextMenus: contributions.contextMenus?.filter(menu => 
        ContextEvaluator.evaluateConditions(menu.context || [], dashboardContext)
      )
    };
    
    return filtered;
  }, [moduleManager, dashboardContext]);
}

/**
 * Hook to get available commands
 */
export function useCommands(): Record<string, ICommand> {
  const moduleManager = useModuleManager();
  const commandManager = useCommandManager();
  
  return useMemo(() => {
    // Combine module commands with registered commands
    const moduleCommands = moduleManager.getCommands();
    const registeredCommands = commandManager.getAllCommands().reduce((acc, cmd) => {
      acc[cmd.id] = cmd;
      return acc;
    }, {} as Record<string, ICommand>);
    
    return { ...moduleCommands, ...registeredCommands };
  }, [moduleManager, commandManager]);
}

/**
 * Hook to execute commands
 */
export function useCommandExecutor() {
  const commandManager = useCommandManager();
  const commands = useCommands();
  const dashboardContext = useDashboardContext();
  
  const executeCommand = async (commandId: string, params?: Record<string, unknown>) => {
    const command = commands[commandId];
    if (!command) {
      throw new Error(`Command '${commandId}' not found`);
    }
    
    if (command.canExecute && !command.canExecute(dashboardContext)) {
      throw new Error(`Command '${commandId}' cannot be executed in the current context`);
    }
    
    await command.execute(params);
  };
  
  const canExecuteCommand = (commandId: string): boolean => {
    const command = commands[commandId];
    if (!command) return false;
    
    return command.canExecute ? command.canExecute(dashboardContext) : true;
  };
  
  return { executeCommand, canExecuteCommand };
}

/**
 * Hook to track module loading state
 */
export function useModuleState(moduleName?: string) {
  const moduleManager = useModuleManager();
  const [moduleInfos, setModuleInfos] = useState<Record<string, ModuleInfo>>({});
  
  useEffect(() => {
    const updateModuleInfos = () => {
      const loaded = moduleManager.getLoadedModules();
      const infos = loaded.reduce((acc, info) => {
        acc[info.config.name] = info;
        return acc;
      }, {} as Record<string, ModuleInfo>);
      setModuleInfos(infos);
    };
    
    // Initial load
    updateModuleInfos();
    
    // Listen for state changes
    const unsubscribe = moduleManager.addStateChangeListener(() => {
      updateModuleInfos();
    });
    
    return unsubscribe;
  }, [moduleManager]);
  
  if (moduleName) {
    return moduleInfos[moduleName] || null;
  }
  
  return moduleInfos;
}

/**
 * Hook to load a module on demand
 */
export function useModuleLoader() {
  const moduleManager = useModuleManager();
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());
  
  const loadModule = async (moduleName: string) => {
    if (loadingModules.has(moduleName)) {
      return; // Already loading
    }
    
    setLoadingModules(prev => new Set(prev).add(moduleName));
    
    try {
      await moduleManager.loadModule(moduleName);
    } finally {
      setLoadingModules(prev => {
        const next = new Set(prev);
        next.delete(moduleName);
        return next;
      });
    }
  };
  
  const unloadModule = async (moduleName: string) => {
    await moduleManager.unloadModule(moduleName);
  };
  
  return {
    loadModule,
    unloadModule,
    isLoading: (moduleName: string) => loadingModules.has(moduleName)
  };
}

/**
 * Provider component for module system
 */
interface ModuleProviderProps {
  moduleManager: IModuleManager;
  commandManager: CommandManager;
  dashboardContext?: DashboardContext;
  children: React.ReactNode;
}

export const ModuleProvider: React.FC<ModuleProviderProps> = ({
  moduleManager,
  commandManager,
  dashboardContext = {},
  children
}) => {
  // Update command manager's global context when dashboard context changes
  useEffect(() => {
    commandManager.updateGlobalContext(dashboardContext);
  }, [commandManager, dashboardContext]);
  
  return React.createElement(
    ModuleManagerContext.Provider,
    { value: moduleManager },
    React.createElement(
      CommandManagerContext.Provider,
      { value: commandManager },
      React.createElement(
        DashboardContext.Provider,
        { value: dashboardContext },
        children
      )
    )
  );
};

/**
 * Component to automatically load modules on mount
 */
interface ModuleLoaderProps {
  modules?: string[];
  autoLoadAll?: boolean;
  fallback?: React.ComponentType<{ error?: Error }>;
  children?: React.ReactNode;
}

export const ModuleLoader: React.FC<ModuleLoaderProps> = ({
  modules,
  autoLoadAll = false,
  fallback: Fallback,
  children
}) => {
  const moduleManager = useModuleManager();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const loadModules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (autoLoadAll) {
          await moduleManager.loadAllModules();
        } else if (modules) {
          for (const moduleName of modules) {
            await moduleManager.loadModule(moduleName);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    loadModules();
  }, [moduleManager, modules, autoLoadAll]);
  
  if (error && Fallback) {
    return <Fallback error={error} />;
  }
  
  if (loading) {
    return <div>Loading modules...</div>;
  }
  
  return <>{children}</>;
};

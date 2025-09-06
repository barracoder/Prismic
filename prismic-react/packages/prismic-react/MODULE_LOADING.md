# Dynamic Module Loading for Prismic React

This document describes the dynamic module loading system implemented for the Prismic React framework, specifically designed for dashboard applications with context-sensitive UI contributions.

## Overview

The dynamic module loading system provides:

- **Runtime Module Loading**: Load modules on-demand using dynamic imports and React.lazy
- **UI Contributions**: Modules can contribute sidebars, menus, toolbars, and status bar items
- **Command Pattern**: Extensible command system for actions
- **Context Sensitivity**: UI elements show/hide based on application context
- **Dependency Management**: Automatic resolution of module dependencies
- **Configuration-Driven**: Module discovery via JSON catalogs

## Core Concepts

### Module Interface

```typescript
interface IReactModule {
  readonly name: string;
  readonly version?: string;
  readonly priority: number;
  readonly dependencies?: string[];
  
  initialize(context: ModuleContext): Promise<void>;
  dispose?(): Promise<void>;
  getComponents?(): Record<string, React.ComponentType<any>>;
  getUIContributions?(): UIContributions;
  getCommands?(): Record<string, ICommand>;
}
```

### UI Contributions

Modules can contribute UI elements to the dashboard shell:

- **Sidebars**: Left/right panels with collapsible sections
- **Menu Items**: Hierarchical menu structure
- **Toolbar Items**: Buttons, toggles, dropdowns with grouping
- **Status Bar Items**: Left/right aligned status information
- **Context Menus**: Right-click menus for specific elements

### Context Sensitivity

UI contributions can specify context conditions:

```typescript
interface ContextCondition {
  key: string; // Property in DashboardContext
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'exists' | 'not-exists';
  value?: any;
}
```

Example - Show sidebar only when an upload is selected:
```typescript
{
  id: 'log-details-sidebar',
  title: 'Log Details',
  component: UploadLogDetails,
  position: 'right',
  context: [
    { key: 'selectedUpload', operator: 'exists' }
  ]
}
```

## Usage Examples

### Basic Setup

```typescript
import { 
  ReactModuleManager, 
  CommandManager, 
  ModuleProvider,
  DashboardShell 
} from 'prismic-react';

function App() {
  const [moduleManager] = useState(() => new ReactModuleManager({
    container: new Container(),
    eventAggregator: new EventAggregator(),
    regionManager: new RegionManager()
  }));
  
  const [commandManager] = useState(() => new CommandManager());
  
  return (
    <ModuleProvider 
      moduleManager={moduleManager}
      commandManager={commandManager}
      dashboardContext={{ user: currentUser }}
    >
      <DashboardShell>
        <YourMainContent />
      </DashboardShell>
    </ModuleProvider>
  );
}
```

### Creating a Module

```typescript
export class UploadLogsModule extends BaseReactModule {
  public readonly name = 'UploadLogsModule';
  public readonly priority = 900;
  public readonly dependencies = ['CoreDashboardModule'];
  
  protected async onInitialize(context: ModuleContext): Promise<void> {
    // Register services
    this.registerService('uploadLogsService', () => new UploadLogsService());
    
    // Subscribe to events
    this.subscribeToEvent('upload-completed', this.handleUploadCompleted);
  }
  
  public getUIContributions(): UIContributions {
    return {
      sidebars: [{
        id: 'upload-logs',
        title: 'Upload Logs',
        component: UploadLogsList,
        position: 'left',
        priority: 100
      }],
      
      toolbarItems: [{
        id: 'refresh-logs',
        command: 'uploadLogs.refresh',
        tooltip: 'Refresh upload logs',
        icon: 'refresh-icon',
        priority: 100
      }]
    };
  }
  
  public getCommands(): Record<string, ICommand> {
    return {
      'uploadLogs.refresh': new AsyncCommand(
        'uploadLogs.refresh',
        'Refresh Upload Logs',
        async () => this.refreshLogs()
      )
    };
  }
}
```

### Module Catalog

Define modules in a JSON catalog:

```json
{
  "version": "1.0.0",
  "description": "Dashboard module catalog",
  "modules": [
    {
      "name": "CoreDashboardModule",
      "path": "./modules/core-dashboard-module",
      "autoLoad": true,
      "enabled": true,
      "priority": 1000
    },
    {
      "name": "UploadLogsModule", 
      "path": "./modules/upload-logs-module",
      "autoLoad": true,
      "enabled": true,
      "priority": 900,
      "dependencies": ["CoreDashboardModule"]
    }
  ]
}
```

Load from catalog:

```typescript
const catalog = await ModuleCatalogLoader.loadFromJson('/modules/catalog.json');
moduleManager.registerModules(catalog.modules);
await moduleManager.loadAllModules();
```

### Command System

Register and execute commands:

```typescript
// Register command
commandManager.registerCommand(new DelegateCommand(
  'logs.delete',
  'Delete Log',
  async (params) => {
    await deleteLog(params.logId);
  },
  (context) => !!context.selectedUpload // Can execute condition
));

// Execute command
const { executeCommand } = useCommandExecutor();
await executeCommand('logs.delete', { logId: '123' });
```

### Context Management

Update dashboard context to show/hide UI elements:

```typescript
const [dashboardContext, setDashboardContext] = useState({});

const selectUpload = (upload) => {
  setDashboardContext(prev => ({ 
    ...prev, 
    selectedUpload: upload 
  }));
};

// UI contributions with context conditions will automatically show/hide
```

## Hooks

### useModuleManager()
Access the module manager for loading/unloading modules.

### useCommandExecutor()
Execute commands and check if they can be executed.

### useUIContributions()
Get UI contributions filtered by current context.

### useDashboardContext()
Access current dashboard context.

### useModuleState(moduleName?)
Track module loading states.

## Components

### DashboardShell
Complete dashboard layout with dynamic UI contributions.

### DynamicSidebar
Renders sidebar contributions for left/right positions.

### DynamicMenuBar
Renders menu contributions with hierarchical structure.

### DynamicToolbar
Renders toolbar contributions grouped by category.

### DynamicStatusBar
Renders status bar contributions with left/right alignment.

### ModuleProvider
Provides module system contexts to child components.

### ModuleLoader
Automatically loads modules on mount with error handling.

## Benefits for Dashboard Applications

1. **Modularity**: Features can be developed and deployed independently
2. **Context Sensitivity**: UI adapts to current selection/state
3. **Performance**: Code splitting reduces initial bundle size
4. **Extensibility**: New features can be added without core changes
5. **Maintainability**: Clear separation of concerns
6. **Hot Swapping**: Modules can be loaded/unloaded at runtime

## Upload Logs Use Case

Perfect for upload tracking dashboards:

- **Core Module**: Basic dashboard shell and navigation
- **Upload Logs Module**: File upload tracking and management
- **Analytics Module**: Upload statistics and reporting
- **User Management Module**: User permissions and roles
- **Settings Module**: Configuration and preferences
- **Notifications Module**: Real-time upload status updates

Each module contributes relevant UI elements that appear contextually based on user selections and permissions.

## TypeScript Support

Full TypeScript support with:
- Strict typing for module interfaces
- Generic command parameters
- Type-safe UI contributions
- IntelliSense for all APIs

## Error Handling

Robust error handling for:
- Module loading failures
- Command execution errors
- Dependency resolution issues
- Runtime module disposal

## Performance Considerations

- Lazy loading reduces initial bundle size
- Module-level code splitting
- Efficient context evaluation
- Minimal re-renders with React optimizations

This system provides a solid foundation for building scalable, modular dashboard applications with rich, context-sensitive user interfaces.

# Web Prism

A powerful TypeScript framework for building modular web applications with dependency injection, MVVM patterns, and composable UI management. Inspired by Microsoft's Prism framework for WPF, Web Prism brings enterprise-grade application architecture patterns to the web.

## Features

- **Dependency Injection Container** - Service registration and resolution with multiple lifetime scopes
- **Event Aggregator** - Loosely coupled communication between components
- **Region Management** - Composable UI management for building complex layouts
- **Module System** - Pluggable architecture for building maintainable applications
- **MVVM Support** - View models with property change notification and command patterns
- **TypeScript First** - Full type safety and excellent IDE support
- **Zero Dependencies** - No external runtime dependencies
- **Comprehensive Testing** - 100% test coverage with Jest

## Installation

```bash
npm install web-prism
```

## Quick Start

### Basic Application Setup

```typescript
import { createApplication } from 'web-prism';

// Create and start your application
const app = await createApplication()
  .buildAndStart();

// Access core services
const container = app.container;
const eventAggregator = app.eventAggregator;
const regionManager = app.regionManager;
```

### Dependency Injection

```typescript
import { Container, ServiceLifetime } from 'web-prism';

const container = new Container();

// Register services with different lifetimes
container.registerSingleton('userService', () => new UserService());
container.registerTransient('logger', () => new Logger());
container.registerScoped('httpClient', () => new HttpClient());

// Register instances
container.registerInstance('config', { apiUrl: 'https://api.example.com' });

// Resolve services
const userService = container.resolve<UserService>('userService');
const logger = container.resolve<Logger>('logger');
```

### Event Aggregator

```typescript
import { EventAggregator, BaseEvent } from 'web-prism';

// Define custom events
class UserLoggedInEvent extends BaseEvent {
  static readonly TYPE = 'user-logged-in';
  
  constructor(public readonly userId: string) {
    super(UserLoggedInEvent.TYPE);
  }
}

const eventAggregator = new EventAggregator();

// Subscribe to events
const subscription = eventAggregator.subscribe(UserLoggedInEvent.TYPE, (event) => {
  console.log(`User ${event.userId} logged in at ${event.timestamp}`);
});

// Publish events
await eventAggregator.publish(new UserLoggedInEvent('user123'));

// Cleanup
subscription.unsubscribe();
```

### MVVM Pattern

```typescript
import { BaseViewModel, DelegateCommand } from 'web-prism';

class UserViewModel extends BaseViewModel {
  private _name = '';
  private _isLoading = false;

  // Property with change notification
  public get name(): string {
    return this.getProperty('name', this._name);
  }

  public set name(value: string) {
    if (this.setProperty('name', value)) {
      this._name = value;
      this.saveCommand.raiseCanExecuteChanged();
    }
  }

  public get isLoading(): boolean {
    return this.getProperty('isLoading', this._isLoading);
  }

  public set isLoading(value: boolean) {
    if (this.setProperty('isLoading', value)) {
      this._isLoading = value;
    }
  }

  // Commands
  public readonly saveCommand = new DelegateCommand(
    async () => await this.save(),
    () => this.name.length > 0 && !this.isLoading
  );

  private async save(): Promise<void> {
    this.isLoading = true;
    try {
      // Save user logic
      await this.userService.save(this.name);
    } finally {
      this.isLoading = false;
    }
  }
}

// Subscribe to property changes
const viewModel = new UserViewModel();
viewModel.propertyChanged.subscribe('property-changed', (event) => {
  console.log(`Property ${event.propertyName} changed from ${event.oldValue} to ${event.newValue}`);
});
```

### Region Management

```typescript
import { RegionManager, SingleViewRegion, BaseView } from 'web-prism';

// Create regions
const regionManager = new RegionManager();
const mainRegion = new SingleViewRegion('main', document.getElementById('main-content')!);
regionManager.registerRegion(mainRegion);

// Create views
class UserListView extends BaseView {
  constructor() {
    super(document.createElement('div'));
    this.element.innerHTML = '<h2>User List</h2><ul id="user-list"></ul>';
  }

  public async render(): Promise<void> {
    // Render user list
    const userList = this.element.querySelector('#user-list')!;
    userList.innerHTML = '<li>User 1</li><li>User 2</li>';
  }
}

// Add and activate views
const userListView = new UserListView();
await mainRegion.addView(userListView);
await mainRegion.activateView(userListView);
```

### Module System

```typescript
import { BaseModule, ModuleContext, Application } from 'web-prism';

class UserModule extends BaseModule {
  public readonly name = 'UserModule';
  public readonly priority = 100;

  public async initialize(context: ModuleContext): Promise<void> {
    // Register services
    context.container.registerSingleton('userService', () => new UserService());
    
    // Subscribe to events
    context.eventAggregator.subscribe('user-login', this.onUserLogin.bind(this));
    
    // Register regions
    const userRegion = new SingleViewRegion('user', document.getElementById('user-panel')!);
    context.regionManager.registerRegion(userRegion);
  }

  private onUserLogin(event: any): void {
    console.log('User logged in from UserModule');
  }
}

// Register and use modules
const app = new Application();
app.registerModule(new UserModule());
await app.start();
```

## Advanced Usage

### Custom Application Class

```typescript
import { Application, ApplicationConfiguration } from 'web-prism';

class MyApplication extends Application {
  constructor(config?: ApplicationConfiguration) {
    super(config);
  }

  protected async onInitializing(): Promise<void> {
    // Custom initialization logic
    this.container.registerSingleton('appConfig', () => ({
      apiUrl: process.env.API_URL || 'http://localhost:3000'
    }));
  }

  protected async onStarted(): Promise<void> {
    console.log('Application started successfully!');
  }
}

const app = new MyApplication();
await app.start();
```

### Dependent Modules

```typescript
import { DependentModule, ModuleContext } from 'web-prism';

class ReportingModule extends DependentModule {
  public readonly name = 'ReportingModule';
  public readonly priority = 50;
  public readonly dependencies = [
    { name: 'UserModule', required: true },
    { name: 'DataModule', required: true }
  ];

  public async initialize(context: ModuleContext): Promise<void> {
    // This module will only load after UserModule and DataModule
    const userService = context.container.resolve<UserService>('userService');
    const dataService = context.container.resolve<DataService>('dataService');
    
    context.container.registerSingleton('reportService', 
      () => new ReportService(userService, dataService)
    );
  }
}
```

### Async Commands

```typescript
import { AsyncCommand } from 'web-prism';

class DataViewModel extends BaseViewModel {
  private _data: any[] = [];
  private _isLoading = false;

  public readonly loadDataCommand = new AsyncCommand(
    async () => await this.loadData(),
    () => !this.isLoading
  );

  private async loadData(): Promise<void> {
    this.isLoading = true;
    try {
      this._data = await this.dataService.fetchData();
      this.onPropertyChanged('data', [], this._data);
    } finally {
      this.isLoading = false;
    }
  }
}
```

## API Reference

### Container

- `registerSingleton<T>(identifier, factory)` - Register a singleton service
- `registerTransient<T>(identifier, factory)` - Register a transient service
- `registerScoped<T>(identifier, factory)` - Register a scoped service
- `registerInstance<T>(identifier, instance)` - Register an instance
- `resolve<T>(identifier)` - Resolve a service
- `isRegistered(identifier)` - Check if service is registered
- `createChild()` - Create a child container
- `clearScope()` - Clear scoped instances
- `dispose()` - Dispose the container

### EventAggregator

- `subscribe<T>(eventType, handler)` - Subscribe to events
- `publish<T>(event)` - Publish event asynchronously
- `publishSync<T>(event)` - Publish event synchronously
- `hasSubscribers(eventType)` - Check for subscribers
- `getSubscriberCount(eventType)` - Get subscriber count
- `clear()` - Clear all subscriptions
- `clearEventType(eventType)` - Clear specific event subscriptions

### RegionManager

- `registerRegion(region)` - Register a region
- `getRegion(name)` - Get a region by name
- `hasRegion(name)` - Check if region exists
- `unregisterRegion(name)` - Unregister a region
- `getRegionNames()` - Get all region names
- `clearAll()` - Clear all regions

### Application

- `container` - Get the DI container
- `eventAggregator` - Get the event aggregator
- `regionManager` - Get the region manager
- `moduleManager` - Get the module manager
- `initialize()` - Initialize the application
- `start()` - Start the application
- `shutdown()` - Shutdown the application
- `registerModule(module)` - Register a module
- `registerRegion(region)` - Register a region

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Building

```bash
# Build the project
npm run build

# Build in watch mode
npm run build:watch

# Clean build artifacts
npm run clean
```

## License

MIT License. See [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## Changelog

### 1.0.0
- Initial release
- Core dependency injection container
- Event aggregator for pub/sub messaging
- Region management for UI composition
- Module system for application composition
- MVVM support with view models and commands
- Comprehensive test suite
- TypeScript support with full type safety

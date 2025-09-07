# Prismic React

A React adaptation of the Web Prism framework, providing a modular, composable architecture for React applications using dependency injection, event aggregation, and region-based UI composition.

## Features

- **✅ Dependency Injection Container**: Service registration with singleton, transient, and scoped lifetimes
- **✅ Event Aggregator**: Pub/sub messaging system for component communication
- **✅ Region Management**: UI composition using React Portals for flexible layout management
- **✅ React Hooks Integration**: Seamless integration with React patterns
- **✅ TypeScript Support**: Full type safety with strict TypeScript configuration
- **🔄 Module System**: (Coming next) Dynamic module loading with React.lazy and Suspense

## Quick Start

### Installation

```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

### Basic Usage

```tsx
import React, { useEffect, useRef } from 'react';
import { 
  RegionManager, 
  RegionProvider, 
  RegionRenderer, 
  SingleComponentRegion 
} from 'prismic-react';

function App() {
  const regionManager = useRef(new RegionManager());
  const mainRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainRegionRef.current) {
      const mainRegion = new SingleComponentRegion('main', mainRegionRef.current);
      regionManager.current.registerRegion(mainRegion);

      // Add a component to the region
      mainRegion.addComponent({
        component: MyComponent,
        id: 'my-component-1',
        props: { title: 'Hello World' },
        isActive: false
      });
    }
  }, []);

  return (
    <RegionProvider regionManager={regionManager.current}>
      <div>
        <h1>My App</h1>
        <div ref={mainRegionRef} />
        <RegionRenderer regionName="main" />
      </div>
    </RegionProvider>
  );
}
```

## Core Concepts

### Region Management

Regions are areas of your UI where components can be dynamically rendered using React Portals:

```tsx
// Single component region (shows one component at a time)
const singleRegion = new SingleComponentRegion('header', headerElement);

// Multi component region (shows multiple components simultaneously)
const multiRegion = new MultiComponentRegion('sidebar', sidebarElement);

// Register with the region manager
regionManager.registerRegion(singleRegion);
regionManager.registerRegion(multiRegion);
```

### Component Management

Add and manage React components in regions:

```tsx
// Add a component
region.addComponent({
  component: MyComponent,
  id: 'unique-id',
  props: { title: 'Hello' },
  isActive: false
});

// Activate/deactivate components
region.activateComponent('unique-id');
region.deactivateComponent('unique-id');

// Remove components
region.removeComponent('unique-id');
```

### React Hooks

Access framework services using React hooks:

```tsx
import { useRegionManager, useRegion } from 'prismic-react';

function MyComponent() {
  const regionManager = useRegionManager();
  const headerRegion = useRegion('header');
  
  // Use region and manager in your component
}
```

### Dependency Injection

Register and resolve services:

```tsx
import { Container, ServiceLifetime } from 'prismic-react';

const container = new Container();

// Register services
container.register('logger', () => new ConsoleLogger(), ServiceLifetime.Singleton);
container.register('api', () => new ApiService(), ServiceLifetime.Transient);

// Resolve services
const logger = container.resolve<ILogger>('logger');
```

### Event Aggregation

Communicate between components using events:

```tsx
import { EventAggregator, BaseEvent } from 'prismic-react';

// Define an event
class UserLoggedIn extends BaseEvent {
  constructor(public userId: string) {
    super('user-logged-in');
  }
}

// Use the event aggregator
const eventAggregator = new EventAggregator();

// Subscribe to events
eventAggregator.subscribe('user-logged-in', (event: UserLoggedIn) => {
  console.log(`User ${event.userId} logged in`);
});

// Publish events
eventAggregator.publish(new UserLoggedIn('user123'));
```

## Architecture

### Framework Structure

```
src/
├── lib/
│   ├── core/                    # Core framework logic
│   │   ├── container.ts         # Dependency injection
│   │   ├── event-aggregator.ts  # Event system
│   │   └── regions.ts          # Region management
│   ├── react/                   # React-specific components
│   │   ├── RegionComponents.tsx # React components
│   │   ├── hooks.ts            # React hooks
│   │   ├── contexts.ts         # React contexts
│   │   └── index.ts            # React exports
│   └── index.ts                # Main exports
├── components/                  # Demo components
└── App.tsx                     # Demo application
```

### Design Principles

1. **React-First**: Built specifically for React using hooks, context, and portals
2. **Type Safety**: Full TypeScript support with strict type checking
3. **Modularity**: Composable architecture with clear separation of concerns
4. **Performance**: Efficient rendering using React's built-in optimization
5. **Developer Experience**: Intuitive APIs following React best practices

## Differences from Web Prism

This React adaptation eliminates concepts that don't apply to React:

- **No ViewModels**: React components manage their own state
- **No Manual Binding**: React handles data binding automatically
- **Portal-Based Regions**: Uses React Portals instead of direct DOM manipulation
- **Hook Integration**: Framework services accessible via React hooks
- **Context Providers**: Uses React Context for dependency injection

## Demo Application

The included demo showcases:

- Region-based UI composition
- Component lifecycle management
- React Portal rendering
- TypeScript integration
- Modern React patterns

Run the demo:

```bash
npm run dev
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Next Steps

- [ ] Module system with React.lazy and Suspense
- [ ] Context providers for dependency injection
- [ ] Navigation system integration
- [ ] State management helpers
- [ ] Performance optimization tools

## License

MIT License - see LICENSE file for details.

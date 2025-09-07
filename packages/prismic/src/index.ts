// Core framework exports
export { Container, ServiceLifetime, type ServiceIdentifier, type Constructor } from './core/container';
export { 
  EventAggregator, 
  BaseEvent,
  type IEvent,
  type EventHandler,
  type EventSubscription 
} from './core/event-aggregator';
export {
  RegionManager,
  SingleViewRegion,
  MultiViewRegion,
  BaseView,
  type IRegion,
  type IView,
  type IActivatable
} from './core/region-manager';
export {
  ModuleManager,
  BaseModule,
  DependentModule,
  ModuleState,
  type IModule,
  type ModuleContext,
  type ModuleDependency,
  type ModuleInfo
} from './core/module-manager';
export {
  Application,
  ApplicationBuilder,
  ApplicationStartingEvent,
  ApplicationStartedEvent,
  ApplicationShuttingDownEvent,
  type ApplicationConfiguration
} from './core/application';

// MVVM exports
export {
  BaseViewModel,
  DelegateCommand,
  AsyncCommand,
  BaseViewWithViewModel,
  PropertyChangedEvent,
  CommandCanExecuteChangedEvent,
  type INotifyPropertyChanged,
  type ICommand
} from './mvvm/base-view-model';

// Utility types and helpers
export type {
  ServiceRegistration
} from './core/container';

// Import for factory functions
import { Container } from './core/container';
import { EventAggregator } from './core/event-aggregator';
import { RegionManager } from './core/region-manager';
import { ApplicationBuilder } from './core/application';

/**
 * Create a new application builder
 */
export function createApplication(): ApplicationBuilder {
  return new ApplicationBuilder();
}

/**
 * Create a new container
 */
export function createContainer(): Container {
  return new Container();
}

/**
 * Create a new event aggregator
 */
export function createEventAggregator(): EventAggregator {
  return new EventAggregator();
}

/**
 * Create a new region manager
 */
export function createRegionManager(): RegionManager {
  return new RegionManager();
}

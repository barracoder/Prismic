/**
 * Core interfaces for dynamic module loading in React applications
 */

import React from 'react';
import { Container } from '../core/container';
import { EventAggregator } from '../core/event-aggregator';
import { RegionManager } from '../core/regions';

/**
 * Module initialization context - provides access to core framework services
 */
export interface ModuleContext {
  readonly container: Container;
  readonly eventAggregator: EventAggregator;
  readonly regionManager: RegionManager;
  readonly moduleManager: IModuleManager;
}

/**
 * Configuration for a module
 */
export interface ModuleConfig {
  name: string;
  path: string; // Path for dynamic import
  autoLoad: boolean;
  dependencies?: string[];
  priority: number;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Module loading states
 */
export enum ModuleState {
  NotLoaded = 'not-loaded',
  Loading = 'loading',
  Loaded = 'loaded',
  Failed = 'failed',
  Disposed = 'disposed'
}

/**
 * Module information including state and metadata
 */
export interface ModuleInfo {
  config: ModuleConfig;
  state: ModuleState;
  module?: IReactModule;
  error?: Error;
  loadTime?: Date;
}

/**
 * Core interface for React modules
 */
export interface IReactModule {
  readonly name: string;
  readonly version?: string;
  readonly priority: number;
  readonly dependencies?: string[];

  /**
   * Initialize the module with the provided context
   */
  initialize(context: ModuleContext): Promise<void>;

  /**
   * Dispose of the module and clean up resources
   */
  dispose?(): Promise<void>;

  /**
   * Get components that can be dynamically loaded
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getComponents?(): Record<string, React.ComponentType<any>>;

  /**
   * Get UI contributions for dashboard elements
   */
  getUIContributions?(): UIContributions;

  /**
   * Get commands provided by this module
   */
  getCommands?(): Record<string, ICommand>;

  /**
   * Get context providers for when this module is active
   */
  getContextProviders?(): ContextProviderDefinition[];
}

/**
 * UI contributions that modules can provide to the dashboard shell
 */
export interface UIContributions {
  sidebars?: SidebarContribution[];
  menuItems?: MenuItemContribution[];
  toolbarItems?: ToolbarItemContribution[];
  statusBarItems?: StatusBarItemContribution[];
  contextMenus?: ContextMenuContribution[];
}

/**
 * Sidebar contribution
 */
export interface SidebarContribution {
  id: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any> | string;
  position: 'left' | 'right';
  priority: number;
  context?: ContextCondition[];
  defaultVisible?: boolean;
  collapsible?: boolean;
}

/**
 * Menu item contribution
 */
export interface MenuItemContribution {
  id: string;
  label: string;
  command: string;
  group?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any> | string;
  shortcut?: string;
  context?: ContextCondition[];
  submenu?: MenuItemContribution[];
  separator?: boolean;
}

/**
 * Toolbar item contribution
 */
export interface ToolbarItemContribution {
  id: string;
  command: string;
  tooltip?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: React.ComponentType<any> | string;
  text?: string;
  group?: string;
  priority: number;
  context?: ContextCondition[];
  type?: 'button' | 'toggle' | 'dropdown' | 'separator';
}

/**
 * Status bar item contribution
 */
export interface StatusBarItemContribution {
  id: string;
  text: string;
  tooltip?: string;
  command?: string;
  priority: number;
  alignment: 'left' | 'right';
  context?: ContextCondition[];
}

/**
 * Context menu contribution
 */
export interface ContextMenuContribution {
  id: string;
  selector: string; // CSS selector for elements that should show this context menu
  items: MenuItemContribution[];
  context?: ContextCondition[];
}

/**
 * Context condition for conditional UI contributions
 */
export interface ContextCondition {
  key: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'exists' | 'not-exists';
  value?: unknown;
}

/**
 * Context provider definition for modules
 */
export interface ContextProviderDefinition {
  key: string;
  provider: React.ComponentType<{children: React.ReactNode}>;
  priority: number;
}

/**
 * Command interface following the Command pattern
 */
export interface ICommand {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly category?: string;
  
  /**
   * Execute the command with optional parameters
   */
  execute(params?: Record<string, unknown>): Promise<void> | void;
  
  /**
   * Check if the command can be executed in the current context
   */
  canExecute?(context?: Record<string, unknown>): boolean;
  
  /**
   * Event fired when canExecute status changes
   */
  onCanExecuteChanged?: (handler: () => void) => () => void;
}

/**
 * Module manager interface
 */
export interface IModuleManager {
  /**
   * Register a module configuration
   */
  registerModule(config: ModuleConfig): void;
  
  /**
   * Load a specific module
   */
  loadModule(name: string): Promise<void>;
  
  /**
   * Load all auto-load modules
   */
  loadAllModules(): Promise<void>;
  
  /**
   * Unload a module
   */
  unloadModule(name: string): Promise<void>;
  
  /**
   * Get module information
   */
  getModuleInfo(name: string): ModuleInfo | undefined;
  
  /**
   * Get all loaded modules
   */
  getLoadedModules(): ModuleInfo[];
  
  /**
   * Check if a module is loaded
   */
  isModuleLoaded(name: string): boolean;
  
  /**
   * Get all UI contributions from loaded modules
   */
  getUIContributions(): UIContributions;
  
  /**
   * Get all commands from loaded modules
   */
  getCommands(): Record<string, ICommand>;
  
  /**
   * Add a module state change listener
   */
  addStateChangeListener(listener: (moduleName: string, state: ModuleState) => void): () => void;
}

/**
 * Dashboard context interface - specific to dashboard applications
 */
export interface DashboardContext {
  selectedUpload?: UploadLogEntry;
  selectedLogs?: UploadLogEntry[];
  currentView?: string;
  user?: UserInfo;
  permissions?: string[];
  [key: string]: unknown;
}

/**
 * Upload log entry interface - core domain model
 */
export interface UploadLogEntry {
  id: string;
  fileName: string;
  fileSize: number;
  uploadTime: Date;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * User information interface
 */
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

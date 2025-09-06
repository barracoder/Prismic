import React from 'react';
import { ICommand, ContextCondition, DashboardContext } from './interfaces';

/**
 * Base implementation of the Command pattern for React applications
 */
export abstract class BaseCommand implements ICommand {
  private canExecuteChangedHandlers = new Set<() => void>();
  
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description?: string,
    public readonly category?: string
  ) {}
  
  /**
   * Execute the command with optional parameters
   */
  abstract execute(params?: Record<string, unknown>): Promise<void> | void;
  
  /**
   * Check if the command can be executed in the current context
   */
  canExecute?(context?: Record<string, unknown>): boolean;
  
  /**
   * Subscribe to canExecute status changes
   */
  onCanExecuteChanged(handler: () => void): () => void {
    this.canExecuteChangedHandlers.add(handler);
    return () => this.canExecuteChangedHandlers.delete(handler);
  }
  
  /**
   * Notify that canExecute status may have changed
   */
  protected raiseCanExecuteChanged(): void {
    this.canExecuteChangedHandlers.forEach(handler => {
      try {
        handler();
      } catch (error) {
        console.error('Error in canExecuteChanged handler:', error);
      }
    });
  }
}

/**
 * Delegate command - wraps functions as commands
 */
export class DelegateCommand extends BaseCommand {
  constructor(
    id: string,
    title: string,
    private executeAction: (params?: Record<string, unknown>) => Promise<void> | void,
    private canExecuteFunc?: (context?: Record<string, unknown>) => boolean,
    description?: string,
    category?: string
  ) {
    super(id, title, description, category);
  }
  
  execute(params?: Record<string, unknown>): Promise<void> | void {
    return this.executeAction(params);
  }
  
  canExecute(context?: Record<string, unknown>): boolean {
    return this.canExecuteFunc ? this.canExecuteFunc(context) : true;
  }
}

/**
 * Async command with loading state management
 */
export class AsyncCommand extends BaseCommand {
  private _isExecuting = false;
  
  constructor(
    id: string,
    title: string,
    private executeAction: (params?: Record<string, unknown>) => Promise<void>,
    private canExecuteFunc?: (context?: Record<string, unknown>) => boolean,
    description?: string,
    category?: string
  ) {
    super(id, title, description, category);
  }
  
  get isExecuting(): boolean {
    return this._isExecuting;
  }
  
  async execute(params?: Record<string, unknown>): Promise<void> {
    if (this._isExecuting) return;
    
    this._isExecuting = true;
    this.raiseCanExecuteChanged();
    
    try {
      await this.executeAction(params);
    } finally {
      this._isExecuting = false;
      this.raiseCanExecuteChanged();
    }
  }
  
  canExecute(context?: Record<string, unknown>): boolean {
    if (this._isExecuting) return false;
    return this.canExecuteFunc ? this.canExecuteFunc(context) : true;
  }
}

/**
 * Command manager for registering and executing commands
 */
export class CommandManager {
  private commands = new Map<string, ICommand>();
  private globalContext: Record<string, unknown> = {};
  
  /**
   * Register a command
   */
  registerCommand(command: ICommand): void {
    if (this.commands.has(command.id)) {
      throw new Error(`Command with ID '${command.id}' is already registered`);
    }
    this.commands.set(command.id, command);
  }
  
  /**
   * Unregister a command
   */
  unregisterCommand(commandId: string): void {
    this.commands.delete(commandId);
  }
  
  /**
   * Execute a command by ID
   */
  async executeCommand(commandId: string, params?: Record<string, unknown>): Promise<void> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error(`Command '${commandId}' not found`);
    }
    
    if (command.canExecute && !command.canExecute(this.globalContext)) {
      throw new Error(`Command '${commandId}' cannot be executed in the current context`);
    }
    
    await command.execute(params);
  }
  
  /**
   * Get a command by ID
   */
  getCommand(commandId: string): ICommand | undefined {
    return this.commands.get(commandId);
  }
  
  /**
   * Get all registered commands
   */
  getAllCommands(): ICommand[] {
    return Array.from(this.commands.values());
  }
  
  /**
   * Get commands by category
   */
  getCommandsByCategory(category: string): ICommand[] {
    return Array.from(this.commands.values())
      .filter(cmd => cmd.category === category);
  }
  
  /**
   * Update global context
   */
  updateGlobalContext(context: Record<string, unknown>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }
  
  /**
   * Check if a command can be executed
   */
  canExecuteCommand(commandId: string, context?: Record<string, unknown>): boolean {
    const command = this.commands.get(commandId);
    if (!command) return false;
    
    const combinedContext = { ...this.globalContext, ...context };
    return command.canExecute ? command.canExecute(combinedContext) : true;
  }
}

/**
 * Context evaluator for conditional UI contributions
 */
export class ContextEvaluator {
  /**
   * Evaluate context conditions against current dashboard context
   */
  static evaluateConditions(conditions: ContextCondition[], context: DashboardContext): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions means always visible
    }
    
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }
  
  /**
   * Evaluate a single context condition
   */
  private static evaluateCondition(condition: ContextCondition, context: DashboardContext): boolean {
    const contextValue = (context as any)[condition.key];
    
    switch (condition.operator) {
      case 'equals':
        return contextValue === condition.value;
      
      case 'not-equals':
        return contextValue !== condition.value;
      
      case 'contains':
        return Array.isArray(contextValue) && contextValue.includes(condition.value);
      
      case 'not-contains':
        return !Array.isArray(contextValue) || !contextValue.includes(condition.value);
      
      case 'exists':
        return contextValue !== undefined && contextValue !== null;
      
      case 'not-exists':
        return contextValue === undefined || contextValue === null;
      
      default:
        console.warn(`Unknown context condition operator: ${condition.operator}`);
        return false;
    }
  }
}

/**
 * Common dashboard commands for upload log management
 */
export class DashboardCommands {
  static readonly REFRESH_LOGS = 'dashboard.refreshLogs';
  static readonly DELETE_LOG = 'dashboard.deleteLog';
  static readonly RETRY_UPLOAD = 'dashboard.retryUpload';
  static readonly EXPORT_LOGS = 'dashboard.exportLogs';
  static readonly CLEAR_FAILED = 'dashboard.clearFailed';
  static readonly SHOW_LOG_DETAILS = 'dashboard.showLogDetails';
  static readonly FILTER_LOGS = 'dashboard.filterLogs';
  static readonly BULK_DELETE = 'dashboard.bulkDelete';
  
  /**
   * Create standard dashboard commands
   */
  static createStandardCommands(): ICommand[] {
    return [
      new DelegateCommand(
        this.REFRESH_LOGS,
        'Refresh Logs',
        async () => {
          // Implementation would be injected via context or service
          console.log('Refreshing upload logs...');
        },
        undefined,
        'Refresh the upload logs list',
        'dashboard'
      ),
      
      new DelegateCommand(
        this.DELETE_LOG,
        'Delete Log',
        async (params) => {
          const logId = params?.logId;
          if (logId) {
            console.log(`Deleting log: ${logId}`);
          }
        },
        (context) => {
          return !!(context as DashboardContext)?.selectedUpload;
        },
        'Delete the selected upload log',
        'dashboard'
      ),
      
      new DelegateCommand(
        this.RETRY_UPLOAD,
        'Retry Upload',
        async (params) => {
          const logId = params?.logId;
          if (logId) {
            console.log(`Retrying upload: ${logId}`);
          }
        },
        (context) => {
          const dashContext = context as DashboardContext;
          return dashContext?.selectedUpload?.status === 'failed';
        },
        'Retry a failed upload',
        'dashboard'
      ),
      
      new DelegateCommand(
        this.EXPORT_LOGS,
        'Export Logs',
        async () => {
          console.log('Exporting logs...');
        },
        undefined,
        'Export logs to CSV or JSON',
        'dashboard'
      ),
      
      new DelegateCommand(
        this.BULK_DELETE,
        'Bulk Delete',
        async (params) => {
          const logIds = params?.logIds as string[];
          if (logIds && logIds.length > 0) {
            console.log(`Bulk deleting logs: ${logIds.join(', ')}`);
          }
        },
        (context) => {
          const dashContext = context as DashboardContext;
          return !!(dashContext?.selectedLogs && dashContext.selectedLogs.length > 0);
        },
        'Delete multiple selected logs',
        'dashboard'
      )
    ];
  }
}

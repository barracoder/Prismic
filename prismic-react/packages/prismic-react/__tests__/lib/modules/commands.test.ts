import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  BaseCommand, 
  DelegateCommand, 
  AsyncCommand, 
  CommandManager, 
  ContextEvaluator,
  DashboardCommands 
} from '../../../src/lib/modules/commands';
import { DashboardContext, ContextCondition } from '../../../src/lib/modules/interfaces';

describe('Command System', () => {
  describe('BaseCommand', () => {
    class TestCommand extends BaseCommand {
      public executed = false;
      public executedWith: any = null;
      
      constructor(id: string, title: string) {
        super(id, title);
      }
      
      execute(params?: Record<string, unknown>): void {
        this.executed = true;
        this.executedWith = params;
      }
      
      canExecute(): boolean {
        return true;
      }
    }
    
    it('should create command with basic properties', () => {
      const command = new TestCommand('test.command', 'Test Command');
      
      expect(command.id).toBe('test.command');
      expect(command.title).toBe('Test Command');
    });
    
    it('should execute command', () => {
      const command = new TestCommand('test.command', 'Test Command');
      const params = { key: 'value' };
      
      command.execute(params);
      
      expect(command.executed).toBe(true);
      expect(command.executedWith).toBe(params);
    });
    
    it('should handle canExecuteChanged events', () => {
      const command = new TestCommand('test.command', 'Test Command');
      
      let callCount = 0;
      const unsubscribe = command.onCanExecuteChanged(() => {
        callCount++;
      });
      
      command['raiseCanExecuteChanged']();
      expect(callCount).toBe(1);
      
      command['raiseCanExecuteChanged']();
      expect(callCount).toBe(2);
      
      unsubscribe();
      command['raiseCanExecuteChanged']();
      expect(callCount).toBe(2); // Should not increase after unsubscribe
    });
    
    it('should handle errors in canExecuteChanged handlers', () => {
      const command = new TestCommand('test.command', 'Test Command');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      command.onCanExecuteChanged(() => {
        throw new Error('Handler error');
      });
      
      expect(() => command['raiseCanExecuteChanged']()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('DelegateCommand', () => {
    it('should create delegate command', () => {
      const executeAction = vi.fn();
      const canExecuteFunc = vi.fn().mockReturnValue(true);
      
      const command = new DelegateCommand(
        'delegate.test',
        'Delegate Test',
        executeAction,
        canExecuteFunc,
        'Test description',
        'test'
      );
      
      expect(command.id).toBe('delegate.test');
      expect(command.title).toBe('Delegate Test');
      expect(command.description).toBe('Test description');
      expect(command.category).toBe('test');
    });
    
    it('should execute delegate action', () => {
      const executeAction = vi.fn();
      const command = new DelegateCommand('test', 'Test', executeAction);
      
      const params = { data: 'test' };
      command.execute(params);
      
      expect(executeAction).toHaveBeenCalledWith(params);
    });
    
    it('should evaluate canExecute function', () => {
      const canExecuteFunc = vi.fn().mockReturnValue(false);
      const command = new DelegateCommand('test', 'Test', () => {}, canExecuteFunc);
      
      const context = { user: 'test' };
      const result = command.canExecute(context);
      
      expect(result).toBe(false);
      expect(canExecuteFunc).toHaveBeenCalledWith(context);
    });
    
    it('should default to true when no canExecute function provided', () => {
      const command = new DelegateCommand('test', 'Test', () => {});
      
      expect(command.canExecute()).toBe(true);
    });
  });
  
  describe('AsyncCommand', () => {
    it('should create async command', () => {
      const executeAction = vi.fn().mockResolvedValue(undefined);
      
      const command = new AsyncCommand(
        'async.test',
        'Async Test',
        executeAction
      );
      
      expect(command.id).toBe('async.test');
      expect(command.title).toBe('Async Test');
    });
    
    it('should execute async action', async () => {
      const executeAction = vi.fn().mockResolvedValue(undefined);
      const command = new AsyncCommand('test', 'Test', executeAction);
      
      const params = { data: 'test' };
      await command.execute(params);
      
      expect(executeAction).toHaveBeenCalledWith(params);
    });
    
    it('should manage execution state', async () => {
      let resolveExecution: () => void;
      const executeAction = vi.fn(() => new Promise<void>(resolve => {
        resolveExecution = resolve;
      }));
      
      const command = new AsyncCommand('test', 'Test', executeAction);
      
      expect(command.isExecuting).toBe(false);
      
      const executionPromise = command.execute();
      expect(command.isExecuting).toBe(true);
      
      resolveExecution!();
      await executionPromise;
      
      expect(command.isExecuting).toBe(false);
    });
    
    it('should prevent multiple simultaneous executions', async () => {
      let resolveFirst: () => void;
      const executeAction = vi.fn(() => new Promise<void>(resolve => {
        resolveFirst = resolve;
      }));
      
      const command = new AsyncCommand('test', 'Test', executeAction);
      
      const firstExecution = command.execute();
      const secondExecution = command.execute();
      
      resolveFirst!();
      await firstExecution;
      await secondExecution;
      
      expect(executeAction).toHaveBeenCalledTimes(1);
    });
    
    it('should not be executable while executing', async () => {
      let resolveExecution: () => void;
      const executeAction = vi.fn(() => new Promise<void>(resolve => {
        resolveExecution = resolve;
      }));
      
      const command = new AsyncCommand('test', 'Test', executeAction);
      
      expect(command.canExecute()).toBe(true);
      
      const executionPromise = command.execute();
      expect(command.canExecute()).toBe(false);
      
      resolveExecution!();
      await executionPromise;
      
      expect(command.canExecute()).toBe(true);
    });
    
    it('should raise canExecuteChanged during execution', async () => {
      let resolveExecution: () => void;
      const executeAction = vi.fn(() => new Promise<void>(resolve => {
        resolveExecution = resolve;
      }));
      
      const command = new AsyncCommand('test', 'Test', executeAction);
      
      let changeCount = 0;
      command.onCanExecuteChanged(() => {
        changeCount++;
      });
      
      const executionPromise = command.execute();
      expect(changeCount).toBe(1); // Called when execution starts
      
      resolveExecution!();
      await executionPromise;
      
      expect(changeCount).toBe(2); // Called when execution ends
    });
  });
  
  describe('CommandManager', () => {
    let commandManager: CommandManager;
    
    beforeEach(() => {
      commandManager = new CommandManager();
    });
    
    it('should register and retrieve commands', () => {
      const command = new DelegateCommand('test', 'Test', () => {});
      
      commandManager.registerCommand(command);
      
      expect(commandManager.getCommand('test')).toBe(command);
      expect(commandManager.getAllCommands()).toContain(command);
    });
    
    it('should prevent duplicate command registration', () => {
      const command1 = new DelegateCommand('duplicate', 'Test 1', () => {});
      const command2 = new DelegateCommand('duplicate', 'Test 2', () => {});
      
      commandManager.registerCommand(command1);
      
      expect(() => {
        commandManager.registerCommand(command2);
      }).toThrow("Command with ID 'duplicate' is already registered");
    });
    
    it('should unregister commands', () => {
      const command = new DelegateCommand('test', 'Test', () => {});
      
      commandManager.registerCommand(command);
      expect(commandManager.getCommand('test')).toBe(command);
      
      commandManager.unregisterCommand('test');
      expect(commandManager.getCommand('test')).toBeUndefined();
    });
    
    it('should execute commands by ID', async () => {
      const executeAction = vi.fn();
      const command = new DelegateCommand('test', 'Test', executeAction);
      
      commandManager.registerCommand(command);
      
      const params = { data: 'test' };
      await commandManager.executeCommand('test', params);
      
      expect(executeAction).toHaveBeenCalledWith(params);
    });
    
    it('should throw error for unknown command execution', async () => {
      await expect(commandManager.executeCommand('unknown')).rejects.toThrow(
        "Command 'unknown' not found"
      );
    });
    
    it('should check canExecute before execution', async () => {
      const executeAction = vi.fn();
      const canExecuteFunc = vi.fn().mockReturnValue(false);
      const command = new DelegateCommand('test', 'Test', executeAction, canExecuteFunc);
      
      commandManager.registerCommand(command);
      
      await expect(commandManager.executeCommand('test')).rejects.toThrow(
        "Command 'test' cannot be executed in the current context"
      );
      
      expect(executeAction).not.toHaveBeenCalled();
    });
    
    it('should get commands by category', () => {
      const command1 = new DelegateCommand('test1', 'Test 1', () => {}, undefined, undefined, 'category1');
      const command2 = new DelegateCommand('test2', 'Test 2', () => {}, undefined, undefined, 'category1');
      const command3 = new DelegateCommand('test3', 'Test 3', () => {}, undefined, undefined, 'category2');
      
      commandManager.registerCommand(command1);
      commandManager.registerCommand(command2);
      commandManager.registerCommand(command3);
      
      const category1Commands = commandManager.getCommandsByCategory('category1');
      expect(category1Commands).toHaveLength(2);
      expect(category1Commands).toContain(command1);
      expect(category1Commands).toContain(command2);
      
      const category2Commands = commandManager.getCommandsByCategory('category2');
      expect(category2Commands).toHaveLength(1);
      expect(category2Commands).toContain(command3);
    });
    
    it('should update global context', () => {
      const canExecuteFunc = vi.fn().mockReturnValue(true);
      const command = new DelegateCommand('test', 'Test', () => {}, canExecuteFunc);
      
      commandManager.registerCommand(command);
      commandManager.updateGlobalContext({ user: 'admin' });
      
      commandManager.canExecuteCommand('test');
      
      expect(canExecuteFunc).toHaveBeenCalledWith({ user: 'admin' });
    });
    
    it('should combine global and local context', () => {
      const canExecuteFunc = vi.fn().mockReturnValue(true);
      const command = new DelegateCommand('test', 'Test', () => {}, canExecuteFunc);
      
      commandManager.registerCommand(command);
      commandManager.updateGlobalContext({ global: 'value' });
      
      commandManager.canExecuteCommand('test', { local: 'value' });
      
      expect(canExecuteFunc).toHaveBeenCalledWith({ global: 'value', local: 'value' });
    });
  });
  
  describe('ContextEvaluator', () => {
    const createContext = (data: Partial<DashboardContext>): DashboardContext => ({
      selectedUpload: undefined,
      selectedLogs: undefined,
      currentView: undefined,
      user: undefined,
      permissions: undefined,
      ...data
    });
    
    it('should return true for empty conditions', () => {
      const context = createContext({});
      const result = ContextEvaluator.evaluateConditions([], context);
      expect(result).toBe(true);
    });
    
    it('should evaluate equals condition', () => {
      const context = createContext({ currentView: 'uploads' });
      
      const condition: ContextCondition = {
        key: 'currentView',
        operator: 'equals',
        value: 'uploads'
      };
      
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(true);
      
      condition.value = 'analytics';
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(false);
    });
    
    it('should evaluate not-equals condition', () => {
      const context = createContext({ currentView: 'uploads' });
      
      const condition: ContextCondition = {
        key: 'currentView',
        operator: 'not-equals',
        value: 'analytics'
      };
      
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(true);
      
      condition.value = 'uploads';
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(false);
    });
    
    it('should evaluate exists condition', () => {
      const context = createContext({ 
        selectedUpload: { 
          id: '1', 
          fileName: 'test.pdf', 
          fileSize: 1000, 
          uploadTime: new Date(), 
          status: 'completed' 
        } 
      });
      
      const condition: ContextCondition = {
        key: 'selectedUpload',
        operator: 'exists'
      };
      
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(true);
      
      const emptyContext = createContext({});
      expect(ContextEvaluator.evaluateConditions([condition], emptyContext)).toBe(false);
    });
    
    it('should evaluate not-exists condition', () => {
      const context = createContext({});
      
      const condition: ContextCondition = {
        key: 'selectedUpload',
        operator: 'not-exists'
      };
      
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(true);
      
      const contextWithUpload = createContext({ 
        selectedUpload: { 
          id: '1', 
          fileName: 'test.pdf', 
          fileSize: 1000, 
          uploadTime: new Date(), 
          status: 'completed' 
        } 
      });
      expect(ContextEvaluator.evaluateConditions([condition], contextWithUpload)).toBe(false);
    });
    
    it('should evaluate contains condition', () => {
      const context = createContext({ permissions: ['read', 'write', 'delete'] });
      
      const condition: ContextCondition = {
        key: 'permissions',
        operator: 'contains',
        value: 'write'
      };
      
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(true);
      
      condition.value = 'admin';
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(false);
    });
    
    it('should evaluate not-contains condition', () => {
      const context = createContext({ permissions: ['read', 'write'] });
      
      const condition: ContextCondition = {
        key: 'permissions',
        operator: 'not-contains',
        value: 'delete'
      };
      
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(true);
      
      condition.value = 'read';
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(false);
    });
    
    it('should handle non-array values for contains operations', () => {
      const context = createContext({ currentView: 'uploads' });
      
      const condition: ContextCondition = {
        key: 'currentView',
        operator: 'contains',
        value: 'uploads'
      };
      
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(false);
    });
    
    it('should evaluate multiple conditions (AND logic)', () => {
      const context = createContext({ 
        currentView: 'uploads',
        permissions: ['read', 'write'],
        selectedUpload: { 
          id: '1', 
          fileName: 'test.pdf', 
          fileSize: 1000, 
          uploadTime: new Date(), 
          status: 'completed' 
        }
      });
      
      const conditions: ContextCondition[] = [
        { key: 'currentView', operator: 'equals', value: 'uploads' },
        { key: 'permissions', operator: 'contains', value: 'write' },
        { key: 'selectedUpload', operator: 'exists' }
      ];
      
      expect(ContextEvaluator.evaluateConditions(conditions, context)).toBe(true);
      
      // Change one condition to make it false
      conditions[0].value = 'analytics';
      expect(ContextEvaluator.evaluateConditions(conditions, context)).toBe(false);
    });
    
    it('should handle unknown operators gracefully', () => {
      const context = createContext({ currentView: 'uploads' });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const condition: ContextCondition = {
        key: 'currentView',
        operator: 'unknown' as any,
        value: 'uploads'
      };
      
      expect(ContextEvaluator.evaluateConditions([condition], context)).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown context condition operator: unknown');
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('DashboardCommands', () => {
    const createContext = (data: Partial<DashboardContext>): DashboardContext => ({
      selectedUpload: undefined,
      selectedLogs: undefined,
      currentView: undefined,
      user: undefined,
      permissions: undefined,
      ...data
    });
    
    it('should create standard dashboard commands', () => {
      const commands = DashboardCommands.createStandardCommands();
      
      expect(commands).toHaveLength(5);
      
      const commandIds = commands.map(cmd => cmd.id);
      expect(commandIds).toContain(DashboardCommands.REFRESH_LOGS);
      expect(commandIds).toContain(DashboardCommands.DELETE_LOG);
      expect(commandIds).toContain(DashboardCommands.RETRY_UPLOAD);
      expect(commandIds).toContain(DashboardCommands.EXPORT_LOGS);
      expect(commandIds).toContain(DashboardCommands.BULK_DELETE);
    });
    
    it('should have commands with proper categories', () => {
      const commands = DashboardCommands.createStandardCommands();
      
      const refreshCommand = commands.find(cmd => cmd.id === DashboardCommands.REFRESH_LOGS);
      const deleteCommand = commands.find(cmd => cmd.id === DashboardCommands.DELETE_LOG);
      const exportCommand = commands.find(cmd => cmd.id === DashboardCommands.EXPORT_LOGS);
      
      expect(refreshCommand?.category).toBe('dashboard');
      expect(deleteCommand?.category).toBe('dashboard');
      expect(exportCommand?.category).toBe('dashboard');
    });
    
    it('should have context-aware commands', () => {
      const commands = DashboardCommands.createStandardCommands();
      
      const deleteCommand = commands.find(cmd => cmd.id === DashboardCommands.DELETE_LOG);
      const retryCommand = commands.find(cmd => cmd.id === DashboardCommands.RETRY_UPLOAD);
      
      expect(deleteCommand?.canExecute).toBeDefined();
      expect(retryCommand?.canExecute).toBeDefined();
    });
    
    it('should evaluate canExecute conditions correctly', () => {
      const commands = DashboardCommands.createStandardCommands();
      
      const deleteCommand = commands.find(cmd => cmd.id === DashboardCommands.DELETE_LOG);
      const retryCommand = commands.find(cmd => cmd.id === DashboardCommands.RETRY_UPLOAD);
      const bulkDeleteCommand = commands.find(cmd => cmd.id === DashboardCommands.BULK_DELETE);
      
      // Test delete command
      const contextWithUpload = createContext({ 
        selectedUpload: { 
          id: '1', 
          fileName: 'test.pdf', 
          fileSize: 1000, 
          uploadTime: new Date(), 
          status: 'completed' 
        } 
      });
      const contextWithoutUpload = createContext({});
      
      expect(deleteCommand?.canExecute?.(contextWithUpload)).toBe(true);
      expect(deleteCommand?.canExecute?.(contextWithoutUpload)).toBe(false);
      
      // Test retry command  
      const contextWithFailedUpload = createContext({ 
        selectedUpload: { 
          id: '2', 
          fileName: 'failed.pdf', 
          fileSize: 2000, 
          uploadTime: new Date(), 
          status: 'failed' 
        } 
      });
      
      expect(retryCommand?.canExecute?.(contextWithFailedUpload)).toBe(true);
      expect(retryCommand?.canExecute?.(contextWithUpload)).toBe(false); // completed status
      
      // Test bulk delete command
      const contextWithMultipleLogs = createContext({ 
        selectedLogs: [
          { id: '1', fileName: 'file1.pdf', fileSize: 1000, uploadTime: new Date(), status: 'completed' },
          { id: '2', fileName: 'file2.pdf', fileSize: 2000, uploadTime: new Date(), status: 'failed' }
        ] 
      });
      
      expect(bulkDeleteCommand?.canExecute?.(contextWithMultipleLogs)).toBe(true);
      expect(bulkDeleteCommand?.canExecute?.(contextWithoutUpload)).toBe(false);
    });
  });
});

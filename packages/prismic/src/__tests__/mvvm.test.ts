import { 
  BaseViewModel, 
  DelegateCommand, 
  AsyncCommand,
  PropertyChangedEvent,
  CommandCanExecuteChangedEvent 
} from '../mvvm/base-view-model';

class TestViewModel extends BaseViewModel {
  private _name = '';
  private _age = 0;

  public get name(): string {
    return this.getProperty('name', this._name);
  }

  public set name(value: string) {
    if (this.setProperty('name', value)) {
      this._name = value;
    }
  }

  public get age(): number {
    return this.getProperty('age', this._age);
  }

  public set age(value: number) {
    if (this.setProperty('age', value)) {
      this._age = value;
    }
  }
}

describe('BaseViewModel', () => {
  let viewModel: TestViewModel;

  beforeEach(() => {
    viewModel = new TestViewModel();
  });

  afterEach(() => {
    viewModel.dispose();
  });

  describe('Property Change Notification', () => {
    it('should notify when property changes', () => {
      // Arrange
      const handler = jest.fn();
      viewModel.propertyChanged.subscribe(PropertyChangedEvent.TYPE, handler);

      // Act
      viewModel.name = 'John';

      // Assert
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as PropertyChangedEvent;
      expect(event.propertyName).toBe('name');
      expect(event.oldValue).toBe(undefined); // First time setting, so old value is undefined
      expect(event.newValue).toBe('John');
      expect(event.target).toBe(viewModel);
    });

    it('should provide correct old value on subsequent changes', () => {
      // Arrange
      const handler = jest.fn();
      viewModel.name = 'Alice'; // Set initial value
      viewModel.propertyChanged.subscribe(PropertyChangedEvent.TYPE, handler);

      // Act
      viewModel.name = 'Bob';

      // Assert
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as PropertyChangedEvent;
      expect(event.propertyName).toBe('name');
      expect(event.oldValue).toBe('Alice');
      expect(event.newValue).toBe('Bob');
      expect(event.target).toBe(viewModel);
    });

    it('should not notify when property value does not change', () => {
      // Arrange
      const handler = jest.fn();
      viewModel.propertyChanged.subscribe(PropertyChangedEvent.TYPE, handler);
      viewModel.name = 'John';
      handler.mockClear();

      // Act
      viewModel.name = 'John';

      // Assert
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple property changes', () => {
      // Arrange
      const handler = jest.fn();
      viewModel.propertyChanged.subscribe(PropertyChangedEvent.TYPE, handler);

      // Act
      viewModel.name = 'John';
      viewModel.age = 30;

      // Assert
      expect(handler).toHaveBeenCalledTimes(2);
      
      const nameEvent = handler.mock.calls[0][0] as PropertyChangedEvent;
      expect(nameEvent.propertyName).toBe('name');
      expect(nameEvent.newValue).toBe('John');

      const ageEvent = handler.mock.calls[1][0] as PropertyChangedEvent;
      expect(ageEvent.propertyName).toBe('age');
      expect(ageEvent.newValue).toBe(30);
    });
  });

  describe('Property Management', () => {
    it('should get and set properties correctly', () => {
      // Act
      viewModel.name = 'Alice';
      viewModel.age = 25;

      // Assert
      expect(viewModel.name).toBe('Alice');
      expect(viewModel.age).toBe(25);
    });

    it('should use default values for uninitialized properties', () => {
      // Act
      const defaultName = viewModel.name;
      const defaultAge = viewModel.age;

      // Assert
      expect(defaultName).toBe('');
      expect(defaultAge).toBe(0);
    });
  });

  describe('Disposal', () => {
    it('should clear property changed subscriptions on dispose', () => {
      // Arrange
      const handler = jest.fn();
      viewModel.propertyChanged.subscribe(PropertyChangedEvent.TYPE, handler);

      // Act
      viewModel.dispose();
      viewModel.name = 'Should not notify';

      // Assert
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe('DelegateCommand', () => {
  describe('Basic Command Execution', () => {
    it('should execute command when canExecute is true', async () => {
      // Arrange
      const executeAction = jest.fn();
      const command = new DelegateCommand(executeAction);

      // Act
      await command.execute('test parameter');

      // Assert
      expect(executeAction).toHaveBeenCalledWith('test parameter');
    });

    it('should not execute when canExecute is false', async () => {
      // Arrange
      const executeAction = jest.fn();
      const command = new DelegateCommand(executeAction);
      command.setCanExecute(false);

      // Act
      await command.execute('test parameter');

      // Assert
      expect(executeAction).not.toHaveBeenCalled();
    });

    it('should use canExecute function when provided', () => {
      // Arrange
      const executeAction = jest.fn();
      const canExecuteFunc = jest.fn(() => false);
      const command = new DelegateCommand(executeAction, canExecuteFunc);

      // Act
      const canExecute = command.canExecute;

      // Assert
      expect(canExecute).toBe(false);
      expect(canExecuteFunc).toHaveBeenCalled();
    });
  });

  describe('CanExecute Management', () => {
    it('should allow manual canExecute state changes', () => {
      // Arrange
      const executeAction = jest.fn();
      const command = new DelegateCommand(executeAction);

      // Act
      command.setCanExecute(false);

      // Assert
      expect(command.canExecute).toBe(false);
    });

    it('should throw error when trying to manually set canExecute with function', () => {
      // Arrange
      const executeAction = jest.fn();
      const canExecuteFunc = jest.fn(() => true);
      const command = new DelegateCommand(executeAction, canExecuteFunc);

      // Act & Assert
      expect(() => command.setCanExecute(false)).toThrow(
        'Cannot manually set canExecute when canExecuteFunc is provided'
      );
    });

    it('should raise canExecute changed event', () => {
      // Arrange
      const executeAction = jest.fn();
      const command = new DelegateCommand(executeAction);
      const handler = jest.fn();
      command.canExecuteChanged.subscribe(CommandCanExecuteChangedEvent.TYPE, handler);

      // Act
      command.setCanExecute(false);

      // Assert
      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CommandCanExecuteChangedEvent;
      expect(event.command).toBe(command);
    });
  });
});

describe('AsyncCommand', () => {
  describe('Async Command Execution', () => {
    it('should execute async command', async () => {
      // Arrange
      const executeAction = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      const command = new AsyncCommand(executeAction);

      // Act
      await command.execute('test parameter');

      // Assert
      expect(executeAction).toHaveBeenCalledWith('test parameter');
    });

    it('should prevent execution while command is executing', async () => {
      // Arrange
      let resolveExecution: () => void;
      const executeAction = jest.fn(async () => {
        await new Promise<void>(resolve => {
          resolveExecution = resolve;
        });
      });
      const command = new AsyncCommand(executeAction);

      // Act
      const execution1 = command.execute('param1');
      expect(command.isExecuting).toBe(true);
      expect(command.canExecute).toBe(false);

      const execution2 = command.execute('param2');

      resolveExecution!();
      await execution1;
      await execution2;

      // Assert
      expect(executeAction).toHaveBeenCalledTimes(1);
      expect(executeAction).toHaveBeenCalledWith('param1');
      expect(command.isExecuting).toBe(false);
      expect(command.canExecute).toBe(true);
    });

    it('should restore canExecute state after execution completes', async () => {
      // Arrange
      const executeAction = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      const command = new AsyncCommand(executeAction);

      // Act
      const execution = command.execute();
      expect(command.canExecute).toBe(false);
      expect(command.isExecuting).toBe(true);

      await execution;

      // Assert
      expect(command.canExecute).toBe(true);
      expect(command.isExecuting).toBe(false);
    });

    it('should restore canExecute state even if execution throws', async () => {
      // Arrange
      const executeAction = jest.fn(async () => {
        throw new Error('Execution failed');
      });
      const command = new AsyncCommand(executeAction);

      // Act
      try {
        await command.execute();
      } catch {
        // Expected
      }

      // Assert
      expect(command.canExecute).toBe(true);
      expect(command.isExecuting).toBe(false);
    });

    it('should raise canExecute changed events during execution', async () => {
      // Arrange
      const executeAction = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      const command = new AsyncCommand(executeAction);
      const handler = jest.fn();
      command.canExecuteChanged.subscribe(CommandCanExecuteChangedEvent.TYPE, handler);

      // Act
      await command.execute();

      // Assert
      expect(handler).toHaveBeenCalledTimes(2); // Once when starting, once when finished
    });
  });

  describe('CanExecute with Function', () => {
    it('should respect canExecute function even when not executing', () => {
      // Arrange
      const executeAction = jest.fn(async () => {});
      const canExecuteFunc = jest.fn(() => false);
      const command = new AsyncCommand(executeAction, canExecuteFunc);

      // Act & Assert
      expect(command.canExecute).toBe(false);
      expect(canExecuteFunc).toHaveBeenCalled();
    });

    it('should return false when executing regardless of canExecute function', async () => {
      // Arrange
      let resolveExecution: () => void;
      const executeAction = jest.fn(async () => {
        await new Promise<void>(resolve => {
          resolveExecution = resolve;
        });
      });
      const canExecuteFunc = jest.fn(() => true);
      const command = new AsyncCommand(executeAction, canExecuteFunc);

      // Act
      const execution = command.execute();
      
      // Assert
      expect(command.canExecute).toBe(false); // Should be false during execution
      
      resolveExecution!();
      await execution;
      
      expect(command.canExecute).toBe(true); // Should be true after execution
    });
  });
});

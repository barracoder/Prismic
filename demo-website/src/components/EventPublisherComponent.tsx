import React, { useState } from 'react';
import { useEventAggregator } from 'prismic-react';
import { BaseEvent } from 'prismic-react';

/**
 * Custom event for user actions
 */
export class UserActionEvent extends BaseEvent {
  constructor(
    public readonly action: string,
    public readonly data: Record<string, unknown>,
    public readonly timestamp: Date = new Date()
  ) {
    super('UserAction');
  }
}

/**
 * Custom event for notifications
 */
export class NotificationEvent extends BaseEvent {
  constructor(
    public readonly message: string,
    public readonly type: 'info' | 'success' | 'warning' | 'error' = 'info',
    public readonly timestamp: Date = new Date()
  ) {
    super('Notification');
  }
}

/**
 * Component that demonstrates publishing events using the EventAggregator
 */
export const EventPublisherComponent: React.FC = () => {
  const eventAggregator = useEventAggregator();
  const [lastAction, setLastAction] = useState<string>('None');

  const handleButtonClick = (action: string) => {
    // Publish a user action event
    const userEvent = new UserActionEvent(action, { 
      buttonId: `btn-${action.toLowerCase()}`,
      component: 'EventPublisherComponent'
    });
    
    eventAggregator.publish(userEvent);
    
    // Also publish a notification about the action
    const notificationEvent = new NotificationEvent(
      `User performed action: ${action}`,
      'info'
    );
    
    eventAggregator.publish(notificationEvent);
    
    setLastAction(action);
  };

  const handleSpecialAction = async () => {
    // Publish multiple events in sequence
    await eventAggregator.publish(new NotificationEvent('Starting special action...', 'info'));
    
    setTimeout(async () => {
      await eventAggregator.publish(new UserActionEvent('SPECIAL_PROCESS', { 
        step: 1,
        description: 'Processing data'
      }));
    }, 500);
    
    setTimeout(async () => {
      await eventAggregator.publish(new UserActionEvent('SPECIAL_PROCESS', { 
        step: 2,
        description: 'Finalizing'
      }));
    }, 1000);
    
    setTimeout(async () => {
      await eventAggregator.publish(new NotificationEvent('Special action completed!', 'success'));
    }, 1500);
    
    setLastAction('Special Process');
  };

  return (
    <div style={{ 
      padding: '1rem', 
      border: '1px solid #007acc', 
      borderRadius: '4px', 
      margin: '1rem 0',
      backgroundColor: '#f0f8ff'
    }}>
      <h4>📤 Event Publisher</h4>
      <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
        This component publishes events that other components can listen to.
      </p>
      
      <div style={{ margin: '1rem 0' }}>
        <button 
          onClick={() => handleButtonClick('CLICK')}
          style={{ 
            padding: '0.5rem 1rem', 
            marginRight: '0.5rem',
            backgroundColor: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Simple Click
        </button>
        
        <button 
          onClick={() => handleButtonClick('SAVE')}
          style={{ 
            padding: '0.5rem 1rem', 
            marginRight: '0.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Save Action
        </button>
        
        <button 
          onClick={handleSpecialAction}
          style={{ 
            padding: '0.5rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Special Process
        </button>
      </div>
      
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#333' }}>
        <strong>Last Action:</strong> {lastAction}
      </p>
    </div>
  );
};

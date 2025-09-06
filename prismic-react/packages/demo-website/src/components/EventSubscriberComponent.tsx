import React, { useState, useEffect } from 'react';
import { useEventAggregator } from 'prismic-react';
import { UserActionEvent, NotificationEvent } from './EventPublisherComponent';

interface EventLog {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

/**
 * Component that demonstrates subscribing to events using the EventAggregator
 */
export const EventSubscriberComponent: React.FC = () => {
  const eventAggregator = useEventAggregator();
  const [eventLog, setEventLog] = useState<EventLog[]>([]);
  const [userActionCount, setUserActionCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    // Subscribe to UserActionEvent
    const userActionSubscription = eventAggregator.subscribe<UserActionEvent>('UserAction', (event) => {
      const logEntry: EventLog = {
        id: `user-${Date.now()}-${Math.random()}`,
        type: 'User Action',
        message: `Action: ${(event as UserActionEvent).action}`,
        timestamp: event.timestamp,
        data: (event as UserActionEvent).data
      };
      
      setEventLog(prev => [logEntry, ...prev].slice(0, 10)); // Keep only last 10 events
      setUserActionCount(prev => prev + 1);
    });

    // Subscribe to NotificationEvent
    const notificationSubscription = eventAggregator.subscribe<NotificationEvent>('Notification', (event) => {
      const logEntry: EventLog = {
        id: `notification-${Date.now()}-${Math.random()}`,
        type: `Notification (${(event as NotificationEvent).type})`,
        message: (event as NotificationEvent).message,
        timestamp: event.timestamp
      };
      
      setEventLog(prev => [logEntry, ...prev].slice(0, 10)); // Keep only last 10 events
      setNotificationCount(prev => prev + 1);
    });

    // Cleanup subscriptions when component unmounts
    return () => {
      userActionSubscription.unsubscribe();
      notificationSubscription.unsubscribe();
    };
  }, [eventAggregator]);

  const clearLog = () => {
    setEventLog([]);
    setUserActionCount(0);
    setNotificationCount(0);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  const getEventTypeStyle = (type: string) => {
    if (type.includes('User Action')) {
      return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    } else if (type.includes('success')) {
      return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
    } else if (type.includes('error')) {
      return { backgroundColor: '#ffebee', color: '#d32f2f' };
    } else if (type.includes('warning')) {
      return { backgroundColor: '#fff3e0', color: '#f57c00' };
    } else {
      return { backgroundColor: '#f5f5f5', color: '#424242' };
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      border: '1px solid #28a745', 
      borderRadius: '4px', 
      margin: '1rem 0',
      backgroundColor: '#f8fff9'
    }}>
      <h4>📥 Event Subscriber</h4>
      <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
        This component listens to events and displays them in real-time.
      </p>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '0.9rem' }}>
          <strong>Events Received:</strong> User Actions: {userActionCount}, Notifications: {notificationCount}
        </div>
        <button 
          onClick={clearLog}
          style={{ 
            padding: '0.25rem 0.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Clear Log
        </button>
      </div>
      
      <div style={{ 
        maxHeight: '200px', 
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: 'white'
      }}>
        {eventLog.length === 0 ? (
          <div style={{ 
            padding: '1rem', 
            textAlign: 'center', 
            color: '#999',
            fontStyle: 'italic'
          }}>
            No events received yet. Click buttons in the Event Publisher above.
          </div>
        ) : (
          eventLog.map((log) => (
            <div 
              key={log.id}
              style={{ 
                padding: '0.5rem',
                borderBottom: '1px solid #eee',
                fontSize: '0.8rem'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span 
                  style={{
                    padding: '0.2rem 0.4rem',
                    borderRadius: '3px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    ...getEventTypeStyle(log.type)
                  }}
                >
                  {log.type}
                </span>
                <span style={{ color: '#666' }}>
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              <div style={{ margin: '0.25rem 0' }}>
                {log.message}
              </div>
              {log.data && (
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: '#666',
                  fontFamily: 'monospace',
                  backgroundColor: '#f8f9fa',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '3px'
                }}>
                  {JSON.stringify(log.data, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

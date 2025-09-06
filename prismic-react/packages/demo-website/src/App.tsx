import { useEffect, useRef, useState } from 'react';
import { 
  RegionManager, 
  PrismicFrameworkProvider, 
  RegionRenderer, 
  SingleComponentRegion,
  Container,
  EventAggregator
} from 'prismic-react';
import { WelcomeComponent } from './components/WelcomeComponent';
import { CounterComponent } from './components/CounterComponent';
import { HookTestComponent } from './components/HookTestComponent';
import { EventPublisherComponent } from './components/EventPublisherComponent';
import { EventSubscriberComponent } from './components/EventSubscriberComponent';
import './App.css';

function App() {
  const regionManager = useRef<RegionManager>(new RegionManager());
  const container = useRef<Container>(new Container());
  const eventAggregator = useRef<EventAggregator>(new EventAggregator());
  const welcomeRegionRef = useRef<HTMLDivElement>(null);
  const contentRegionRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) return;

    const manager = regionManager.current;

    // Register regions when DOM elements are ready
    if (welcomeRegionRef.current && contentRegionRef.current) {
      try {
        const welcomeRegion = new SingleComponentRegion('welcome', welcomeRegionRef.current);
        const contentRegion = new SingleComponentRegion('content', contentRegionRef.current);
        
        // Only register if not already registered
        if (!manager.hasRegion('welcome')) {
          manager.registerRegion(welcomeRegion);
        }
        if (!manager.hasRegion('content')) {
          manager.registerRegion(contentRegion);
        }

        // Get the regions (whether newly registered or existing)
        const welcomeRegionInstance = manager.getRegion('welcome');
        const contentRegionInstance = manager.getRegion('content');

        // Add components to the regions
        if (welcomeRegionInstance) {
          welcomeRegionInstance.addComponent({
            component: WelcomeComponent,
            id: 'welcome-1',
            props: {
              title: 'Prismic React Framework',
              subtitle: 'Demonstrating region-based component composition'
            },
            isActive: false
          });
        }

        if (contentRegionInstance) {
          contentRegionInstance.addComponent({
            component: CounterComponent,
            id: 'counter-1',
            props: {
              initialValue: 5,
              step: 1
            },
            isActive: false
          });
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing regions:', error);
      }
    }

    // Cleanup function
    return () => {
      if (isInitialized) {
        manager.clearAll();
        setIsInitialized(false);
      }
    };
  }, [isInitialized]);

  return (
    <PrismicFrameworkProvider 
      regionManager={regionManager.current}
      container={container.current}
      eventAggregator={eventAggregator.current}
    >
      <div className="app">
        <header className="app-header">
          <h1>Prismic React Demo</h1>
          <p>A demonstration of the React adaptation of Web Prism framework</p>
        </header>

        <main className="app-main">
          <section className="demo-section">
            <h2>Welcome Region</h2>
            <p>This region will contain a welcome component rendered via React Portal:</p>
            <div 
              ref={welcomeRegionRef} 
              className="region-container"
              data-region="welcome"
            />
            {isInitialized && <RegionRenderer regionName="welcome" />}
          </section>

          <section className="demo-section">
            <h2>Content Region</h2>
            <p>This region contains an interactive counter component:</p>
            <div 
              ref={contentRegionRef} 
              className="region-container"
              data-region="content"
            />
            {isInitialized && <RegionRenderer regionName="content" />}
          </section>

          <section className="demo-section">
            <h2>Framework Features</h2>
            <ul>
              <li>✅ Dependency Injection Container</li>
              <li>✅ Event Aggregator for component communication</li>
              <li>✅ Region-based UI composition using React Portals</li>
              <li>✅ React Hooks for framework integration</li>
              <li>✅ TypeScript support with strict type checking</li>
              <li>🔄 Module system (coming next)</li>
            </ul>
            <HookTestComponent />
          </section>

          <section className="demo-section">
            <h2>Event Aggregator Demo</h2>
            <p>This demonstrates how components can communicate using the EventAggregator pattern:</p>
            
            <EventPublisherComponent />
            <EventSubscriberComponent />
            
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
              Click the buttons above to see real-time event communication between components!
              The publisher sends events and the subscriber receives and displays them.
            </p>
          </section>
        </main>

        <footer className="app-footer">
          <p>
            This demo shows how the Prismic React framework enables modular, 
            composable UI architecture using React best practices.
          </p>
        </footer>
      </div>
    </PrismicFrameworkProvider>
  );
}

export default App;

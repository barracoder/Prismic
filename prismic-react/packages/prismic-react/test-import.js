// Test importing core modules directly
try {
  const container = require('./src/lib/core/container.ts');
  console.log('Container exports:', Object.keys(container));
} catch (e) {
  console.error('Container import error:', e.message);
}

try {
  const events = require('./src/lib/core/event-aggregator.ts');
  console.log('EventAggregator exports:', Object.keys(events));
} catch (e) {
  console.error('EventAggregator import error:', e.message);
}

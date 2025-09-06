# Prismic React

[![CI](https://github.com/barracoder/Prismic/actions/workflows/ci.yml/badge.svg)](https://github.com/barracoder/Prismic/actions/workflows/ci.yml)
[![Security & Dependencies](https://github.com/barracoder/Prismic/actions/workflows/security.yml/badge.svg)](https://github.com/barracoder/Prismic/actions/workflows/security.yml)
[![Deploy Demo](https://github.com/barracoder/Prismic/actions/workflows/deploy.yml/badge.svg)](https://github.com/barracoder/Prismic/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/barracoder/Prismic/branch/main/graph/badge.svg)](https://codecov.io/gh/barracoder/Prismic)
[![npm version](https://badge.fury.io/js/prismic-react.svg)](https://badge.fury.io/js/prismic-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A React adaptation of the Web Prism framework for dependency injection, event aggregation, and region-based UI composition.

## 🚀 Features

- **Dependency Injection Container**: Manage service dependencies with singleton, transient, and scoped lifetimes
- **Event Aggregator**: Pub/sub communication between components with type-safe events
- **Region-based UI Composition**: Organize UI components using React Portals and regions
- **React Hooks Integration**: Easy-to-use hooks for accessing framework services
- **TypeScript Support**: Full type safety with strict TypeScript checking
- **Comprehensive Testing**: Unit tests, E2E tests, and coverage reporting

## 📦 Installation

```bash
npm install prismic-react
# or
yarn add prismic-react
# or
pnpm add prismic-react
```

## 🎯 Quick Start

```tsx
import React from 'react';
import { 
  PrismicFrameworkProvider, 
  useContainer, 
  useEventAggregator,
  Container,
  EventAggregator,
  RegionManager 
} from 'prismic-react';

// Set up the framework
const container = new Container();
const eventAggregator = new EventAggregator();
const regionManager = new RegionManager();

function App() {
  return (
    <PrismicFrameworkProvider
      container={container}
      eventAggregator={eventAggregator}
      regionManager={regionManager}
    >
      <YourAppComponents />
    </PrismicFrameworkProvider>
  );
}
```

## 📚 Documentation

- [Getting Started Guide](./docs/getting-started.md)
- [API Reference](./docs/api-reference.md)
- [Examples](./docs/examples.md)
- [Demo Website](https://prismic-react-demo.example.com)

## 🏗️ Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/barracoder/Prismic.git
cd Prismic
npm install
```

### Available Scripts

```bash
# Build the library
npm run build

# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all

# Lint code
npm run lint

# Type checking
npm run typecheck -w packages/prismic-react

# Start demo website
npm run dev
```

## 🧪 Testing

This project maintains high test coverage with multiple testing strategies:

- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright for end-to-end scenarios
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint with TypeScript rules

## 📈 CI/CD

The project uses GitHub Actions for:

- ✅ **Continuous Integration**: Automated testing on multiple Node.js versions
- 🔒 **Security Scanning**: CodeQL analysis and dependency auditing  
- 📦 **Automated Releases**: NPM publishing on git tags
- 🚀 **Demo Deployment**: Automatic deployment of demo website
- 🔄 **Dependency Updates**: Weekly automated dependency updates

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the Web Prism framework
- Built with React and TypeScript
- Tested with Vitest and Playwright

---

<p align="center">
  Made with ❤️ by the Prismic React team
</p>

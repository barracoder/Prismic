# Contributing to Prismic React

Thank you for your interest in contributing to Prismic React! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Prismic.git
   cd Prismic
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Library**
   ```bash
   npm run build
   ```

4. **Run Tests**
   ```bash
   npm run test:all
   ```

## 📋 Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical fixes for production

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, well-documented code
   - Follow existing code style and patterns
   - Add/update tests for your changes

3. **Test Your Changes**
   ```bash
   # Run linting
   npm run lint
   
   # Run type checking
   npm run typecheck -w packages/prismic-react
   
   # Run unit tests
   npm run test
   
   # Run E2E tests
   npm run test:e2e
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```bash
feat: add event aggregator subscription management
fix: resolve memory leak in region cleanup
docs: update API documentation for Container class
test: add comprehensive tests for EventAggregator
```

## 🧪 Testing Guidelines

### Unit Tests

- Use Vitest with React Testing Library
- Test files should be in `__tests__` directories
- Aim for high test coverage (>90%)
- Test both happy paths and error cases

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### E2E Tests

- Use Playwright for end-to-end testing
- Test critical user journeys
- Focus on integration between components

```typescript
import { test, expect } from '@playwright/test';

test('should demonstrate framework functionality', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Prismic React Demo');
});
```

## 📝 Code Style

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object definitions
- Use proper return type annotations for functions
- Avoid `any` types (use `unknown` when necessary)

### React

- Use functional components with hooks
- Follow React best practices
- Use proper prop types and interfaces
- Implement proper error boundaries where needed

### General

- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Follow SOLID principles

## 📖 Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for all public APIs
- Update TypeScript interfaces and types
- Include code examples in documentation

## 🔧 Project Structure

```
packages/
├── prismic-react/          # Main library package
│   ├── src/
│   │   ├── lib/
│   │   │   ├── core/       # Core framework logic
│   │   │   └── react/      # React integration
│   │   └── index.ts        # Main exports
│   ├── __tests__/          # Unit tests
│   └── package.json
└── demo-website/           # Demo application
    ├── src/
    ├── public/
    └── package.json
```

## 🚨 Pull Request Process

1. **Before Submitting**
   - Ensure all tests pass
   - Update documentation if needed
   - Check that your changes don't break existing functionality

2. **Pull Request Requirements**
   - Clear, descriptive title
   - Detailed description of changes
   - Link to related issues
   - Screenshots/GIFs for UI changes

3. **Review Process**
   - At least one maintainer review required
   - All CI checks must pass
   - Address feedback promptly

## 🐛 Reporting Issues

When reporting issues, please include:

- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Minimal reproducible example if possible

## 💡 Feature Requests

For feature requests:

- Check if the feature already exists
- Explain the use case and benefits
- Provide implementation ideas if possible
- Be open to discussion and feedback

## 📜 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive community environment

## 🆘 Getting Help

- Check existing issues and documentation
- Ask questions in discussions
- Reach out to maintainers if needed

## 📄 License

By contributing to Prismic React, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Prismic React! 🎉

# Contributing to Traffic Police Backend

Thank you for your interest in contributing to the Traffic Police Backend project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git
- Docker (optional, for local development)

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/traffic-police-backend.git
   cd traffic-police-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📝 Development Workflow

### Code Style
- Use **TypeScript** for all new code
- Follow **ESLint** rules (run `npm run lint`)
- Use **Prettier** for formatting (run `npm run format`)
- Follow **conventional commits** for commit messages

### Testing
- Write tests for new features
- Ensure all tests pass (`npm test`)
- Maintain good test coverage
- Use descriptive test names

### Database Changes
- Create migrations for schema changes
- Update seed data if needed
- Test migrations work correctly

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run type-check      # Check TypeScript types

# Database
npm run db:generate     # Generate Prisma client
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Docker
npm run docker:build    # Build Docker image
npm run docker:run      # Run Docker container
```

## 📋 Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Run Quality Checks**
   ```bash
   npm run lint
   npm run format
   npm run type-check
   npm test
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Review**
   - Ensure CI/CD passes
   - Address review comments
   - Update PR description if needed

## 🏗 Project Structure

```
src/
├── controllers/          # API route handlers
├── middleware/           # Express middleware
├── services/            # Business logic services
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── routes/              # API route definitions
└── app.ts               # Express application setup

tests/                   # Test files
├── setup.ts            # Test configuration
└── __mocks__/          # Mock files

prisma/                  # Database schema and migrations
├── schema.prisma       # Database schema
├── seed.ts             # Database seeding
└── migrations/         # Database migrations
```

## 🧪 Testing Guidelines

### Test Structure
- Place tests in `tests/` directory
- Use descriptive test file names
- Group related tests in describe blocks
- Use meaningful test names

### Test Examples
```typescript
describe('AuthController', () => {
  describe('login', () => {
    it('should return JWT tokens for valid credentials', async () => {
      // Test implementation
    });

    it('should return error for invalid credentials', async () => {
      // Test implementation
    });
  });
});
```

### Mocking
- Mock external services (SMS, file upload)
- Use Prisma mocks for database operations
- Mock JWT tokens for authentication tests

## 🔒 Security Guidelines

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP security guidelines
- Report security issues privately

## 📚 Documentation

- Update README.md for new features
- Add JSDoc comments for functions
- Document API changes
- Update environment variables documentation

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, etc.)
- Error logs if applicable

## 💡 Feature Requests

When requesting features, please include:
- Clear description of the feature
- Use cases and benefits
- Implementation suggestions (optional)
- Priority level

## 📞 Getting Help

- Check existing issues and PRs
- Review documentation
- Ask questions in discussions
- Join our community channels

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to making our roads safer! 🚔

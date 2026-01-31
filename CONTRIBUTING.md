# Contributing to ZYRA Fashion

Thank you for your interest in contributing to ZYRA Fashion! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Contributing Guidelines](#contributing-guidelines)
5. [Development Workflow](#development-workflow)
6. [Code Standards](#code-standards)
7. [Testing](#testing)
8. [Documentation](#documentation)
9. [Pull Request Process](#pull-request-process)
10. [Issue Reporting](#issue-reporting)
11. [Feature Requests](#feature-requests)
12. [Community Guidelines](#community-guidelines)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. We pledge to respect all people who contribute through reporting issues, posting feature requests, updating documentation, submitting pull requests or patches, and other activities.

### Expected Behavior

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or inappropriate language
- Trolling, insulting, or derogatory comments
- Public or private harassment
- Publishing others' private information without permission
- Other conduct that could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@zyra-ultra.com. All complaints will be reviewed and investigated promptly and fairly.

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** for version control
- **PostgreSQL** for database
- **Redis** for caching (optional for development)
- **Stripe account** for payment testing
- **Resend account** for email testing
- **Vercel account** for deployment testing

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/zyra-ultra.git
   cd zyra-ultra
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/zyra-ultra/zyra-ultra.git
   ```

## Development Setup

### Environment Configuration

1. **Copy environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure environment variables**:
   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/zyra_ultra"

   # NextAuth.js
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # OAuth Providers
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"

   # Stripe
   STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
   STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
   STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

   # Vercel Blob Storage
   BLOB_READ_WRITE_TOKEN="vercel_blob_rw_your-token"

   # Resend Email
   RESEND_API_KEY="re_your-resend-api-key"
   RESEND_FROM_EMAIL="noreply@zyra-ultra.com"

   # Redis (optional)
   REDIS_URL="redis://localhost:6379"

   # Monitoring
   SENTRY_DSN="your-sentry-dsn"
   GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
   ```

### Database Setup

1. **Create PostgreSQL database**:
   ```sql
   CREATE DATABASE zyra_ultra;
   ```

2. **Run database migrations**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Seed the database**:
   ```bash
   npm run db:seed
   ```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes** - Fix existing issues
- **Feature additions** - Add new functionality
- **Documentation** - Improve or add documentation
- **Testing** - Add or improve tests
- **Performance** - Optimize existing code
- **Security** - Enhance security measures
- **UI/UX** - Improve user interface and experience

### Contribution Areas

- **Frontend** - React components, pages, and user interface
- **Backend** - API routes, business logic, and data processing
- **Database** - Schema changes, migrations, and queries
- **Infrastructure** - Deployment, CI/CD, and DevOps
- **Documentation** - Guides, API docs, and tutorials
- **Testing** - Unit tests, integration tests, and E2E tests

## Development Workflow

### Branch Strategy

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a pull request** on GitHub

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add OAuth provider support
fix(payment): resolve Stripe webhook validation
docs(api): update endpoint documentation
test(cart): add unit tests for cart functionality
```

### Code Standards

#### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` type usage
- Use strict type checking

#### Code Style

- Use Prettier for code formatting
- Follow ESLint rules
- Use meaningful variable and function names
- Write self-documenting code
- Add comments for complex logic

#### File Organization

```
src/
├── app/                 # Next.js App Router
├── components/          # Reusable UI components
├── lib/                # Utility functions and services
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── styles/             # Global styles
└── test/               # Test files
```

#### Component Structure

```typescript
// components/ExampleComponent.tsx
import React from 'react'
import { cn } from '@/lib/utils'

interface ExampleComponentProps {
  title: string
  description?: string
  className?: string
}

export function ExampleComponent({ 
  title, 
  description, 
  className 
}: ExampleComponentProps) {
  return (
    <div className={cn('default-styles', className)}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}
```

## Testing

### Test Types

- **Unit Tests** - Test individual functions and components
- **Integration Tests** - Test API endpoints and database operations
- **E2E Tests** - Test complete user workflows
- **Performance Tests** - Test application performance

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- --testPathPattern=example.test.ts
```

### Writing Tests

#### Unit Test Example

```typescript
// test/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatPrice, calculateTax } from '@/lib/utils'

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(99.99)).toBe('$99.99')
    expect(formatPrice(0)).toBe('$0.00')
    expect(formatPrice(1000)).toBe('$1,000.00')
  })
})

describe('calculateTax', () => {
  it('should calculate tax correctly', () => {
    expect(calculateTax(100, 0.08)).toBe(8)
    expect(calculateTax(0, 0.08)).toBe(0)
    expect(calculateTax(50.50, 0.10)).toBe(5.05)
  })
})
```

#### Component Test Example

```typescript
// test/components/ProductCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test Description',
  price: 99.99,
  imageUrl: ['https://example.com/image.jpg'],
  categoryId: '1',
  stock: 10,
  sku: 'TEST-001',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('$99.99')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('calls onAddToCart when add to cart button is clicked', () => {
    const onAddToCart = vi.fn()
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />)
    
    const addToCartButton = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(addToCartButton)
    
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct)
  })
})
```

#### API Test Example

```typescript
// test/api/products.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/products/route'

describe('/api/products', () => {
  beforeEach(async () => {
    // Setup test data
  })

  afterEach(async () => {
    // Cleanup test data
  })

  it('should return products list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.success).toBe(true)
    expect(data.data.products).toBeInstanceOf(Array)
  })
})
```

### Test Coverage

We aim for:
- **80%+ code coverage** for critical paths
- **100% coverage** for utility functions
- **90%+ coverage** for API endpoints
- **70%+ coverage** for UI components

## Documentation

### Documentation Types

- **API Documentation** - Endpoint descriptions and examples
- **User Guides** - How-to guides for users
- **Developer Guides** - Technical documentation
- **Architecture Docs** - System design and architecture
- **Deployment Guides** - Setup and deployment instructions

### Writing Documentation

#### API Documentation

```typescript
/**
 * Get all products with pagination and filtering
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20, max: 100)
 * @param category - Filter by category slug
 * @param search - Search term
 * @param sort - Sort field (price, name, createdAt)
 * @param order - Sort order (asc, desc)
 * @returns Promise<ProductListResponse>
 * 
 * @example
 * ```typescript
 * const products = await getProducts({
 *   page: 1,
 *   limit: 20,
 *   category: 'electronics',
 *   search: 'laptop'
 * })
 * ```
 */
export async function getProducts(params: ProductQueryParams): Promise<ProductListResponse> {
  // Implementation
}
```

#### Component Documentation

```typescript
/**
 * ProductCard component displays product information and allows adding to cart
 * 
 * @param product - Product object to display
 * @param onAddToCart - Callback function when add to cart is clicked
 * @param className - Additional CSS classes
 * 
 * @example
 * ```tsx
 * <ProductCard 
 *   product={product} 
 *   onAddToCart={(product) => addToCart(product)} 
 * />
 * ```
 */
export function ProductCard({ product, onAddToCart, className }: ProductCardProps) {
  // Implementation
}
```

### Documentation Standards

- Use clear, concise language
- Include code examples
- Provide context and use cases
- Keep documentation up to date
- Use consistent formatting
- Include error handling examples

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

2. **Update documentation** if needed

3. **Add tests** for new functionality

4. **Update changelog** if applicable

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] E2E tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance impact considered

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #issue_number
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in staging environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

### Merge Strategy

- Use **squash and merge** for feature branches
- Use **merge commit** for hotfixes
- Use **rebase and merge** for documentation updates

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, browser, Node.js version)
5. **Error messages** and logs
6. **Screenshots** if applicable

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Browser: [e.g., Chrome 96, Firefox 95, Safari 15]
- Node.js Version: [e.g., 18.17.0]
- ZYRA Fashion Version: [e.g., 1.4.0]

## Error Messages
```
Paste error messages here
```

## Screenshots
Add screenshots if applicable

## Additional Context
Any other context about the problem
```

## Feature Requests

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other solutions have you considered?

## Additional Context
Any other context or screenshots
```

### Feature Request Guidelines

- **Check existing issues** before creating new ones
- **Provide clear use cases** and benefits
- **Consider implementation complexity**
- **Think about backward compatibility**
- **Consider security implications**

## Community Guidelines

### Getting Help

- **Read documentation** first
- **Search existing issues** for similar problems
- **Ask questions** in GitHub Discussions
- **Join community chat** for real-time help
- **Be patient** with responses

### Providing Help

- **Be welcoming** to new contributors
- **Provide constructive feedback**
- **Share knowledge** and best practices
- **Help others** learn and grow
- **Be respectful** in all interactions

### Recognition

Contributors are recognized through:

- **Contributor hall of fame**
- **Release notes** acknowledgments
- **GitHub contributor badges**
- **Community spotlight** features
- **Special contributor perks**

## Development Resources

### Useful Links

- **Documentation**: [https://docs.zyra-ultra.com](https://docs.zyra-ultra.com)
- **API Reference**: [https://api.zyra-ultra.com](https://api.zyra-ultra.com)
- **Design System**: [https://design.zyra-ultra.com](https://design.zyra-ultra.com)
- **Community Forum**: [https://community.zyra-ultra.com](https://community.zyra-ultra.com)

### Development Tools

- **VS Code** - Recommended editor
- **Postman** - API testing
- **Docker** - Containerization
- **GitHub Desktop** - Git GUI
- **Figma** - Design collaboration

### Learning Resources

- **Next.js Documentation**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **React Documentation**: [https://react.dev](https://react.dev)
- **TypeScript Handbook**: [https://www.typescriptlang.org/docs](https://www.typescriptlang.org/docs)
- **Prisma Documentation**: [https://www.prisma.io/docs](https://www.prisma.io/docs)

## Contact

For questions about contributing:

- **Email**: contributors@zyra-ultra.com
- **GitHub**: [https://github.com/zyra-ultra](https://github.com/zyra-ultra)
- **Discord**: [https://discord.gg/zyra-ultra](https://discord.gg/zyra-ultra)
- **Twitter**: [@zyra_ultra](https://twitter.com/zyra_ultra)

---

Thank you for contributing to ZYRA Fashion! Your contributions help make this project better for everyone.

**Happy coding! 🚀**





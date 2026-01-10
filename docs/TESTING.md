# Testing Guide

This document describes the testing setup and how to run tests for SenpaiBot 2.0.

## Test Framework

We use **Jest** with TypeScript support (`ts-jest`) for unit testing.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are located in `__tests__` directories within each module:

```
src/modules/
├── 8ball/
│   ├── __tests__/
│   │   └── 8ball.test.ts
│   └── index.ts
├── fortune/
│   ├── __tests__/
│   │   └── fortune.test.ts
│   └── index.ts
├── help/
│   ├── __tests__/
│   │   └── help.test.ts
│   └── index.ts
├── adminManager/
│   ├── __tests__/
│   │   └── adminManager.test.ts
│   ├── helpers.ts
│   └── index.ts
├── birthdays/
│   ├── __tests__/
│   │   └── birthdays.test.ts
│   ├── helpers.ts
│   └── index.ts
├── messageLogger/
│   ├── __tests__/
│   │   └── messageLogger.test.ts
│   ├── helpers.ts
│   └── index.ts
├── warframe/
│   ├── __tests__/
│   │   └── warframe.test.ts
│   ├── helpers.ts
│   └── index.ts
├── yugioh/
│   ├── __tests__/
│   │   └── yugioh.test.ts
│   ├── helpers.ts
│   └── index.ts
└── imageBoards/
    ├── __tests__/
    │   └── imageBoards.test.ts
    ├── helpers.ts
    └── index.ts
```

## Test Coverage

Each module test suite covers:

### 1. Module Initialization

- Verifies module properties (name, description, enabled)
- Tests initialization without errors

### 2. Command Handling

- Tests valid command execution
- Tests commands with and without arguments
- Tests misspelling detection
- Tests that unrelated commands are not handled
- Tests edge cases (empty input, spaces, etc.)

### 3. Commands Info

- Verifies command metadata is correct
- Checks usage strings and descriptions

### 4. Helper Functions (for modules with helpers)

- Database operations (add, remove, get)
- Data validation
- Error handling

### 5. Cleanup

- Tests module cleanup without errors

## Example Test Output

```bash
$ npm test

PASS  src/modules/8ball/__tests__/8ball.test.ts
  8ball Module
    Module Initialization
      ✓ should have correct module properties (2 ms)
      ✓ should initialize without errors (1 ms)
    Command Handling
      ✓ should handle valid !8ball command with question (3 ms)
      ✓ should prompt for question when no question provided (2 ms)
      ✓ should handle !8ball with just spaces (1 ms)
      ✓ should detect common misspellings (4 ms)
      ✓ should not handle unrelated commands (1 ms)
      ✓ should not handle regular messages (1 ms)
    Commands Info
      ✓ should return command information (1 ms)
    Cleanup
      ✓ should cleanup without errors (1 ms)

Test Suites: 9 passed, 9 total
Tests:       68 passed, 68 total
```

## Writing New Tests

When adding a new module, create a corresponding test file:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Client, Message } from 'discord.js';
import YourModule from '../index';

const createMockMessage = (content: string): Partial<Message> => {
  return {
    content,
    reply: jest.fn().mockResolvedValue(undefined),
    author: {
      bot: false,
      id: '123456789',
      username: 'TestUser',
    },
  } as unknown as Partial<Message>;
};

describe('Your Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should have correct module properties', () => {
      expect(YourModule.name).toBe('yourModule');
      expect(YourModule.description).toBe('Your module description');
      expect(YourModule.enabled).toBe(true);
    });
  });

  describe('Command Handling', () => {
    it('should handle your command', () => {
      const mockMessage = createMockMessage('!yourcommand');
      const handled = YourModule.handleMessage(mockMessage as Message);

      expect(handled).toBe(true);
      expect(mockMessage.reply).toHaveBeenCalled();
    });
  });
});
```

## Mocking

### Database Mocking

For modules that use the database:

```typescript
const mockDb = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
};

jest.mock('../../database', () => ({
  db: mockDb,
  dbPromise: Promise.resolve(mockDb),
}));
```

### Discord.js Mocking

Message objects are mocked with essential properties:

```typescript
const createMockMessage = (content: string): Partial<Message> => {
  return {
    content,
    reply: jest.fn().mockResolvedValue(undefined),
    author: { bot: false, id: '123', username: 'Test' },
  } as unknown as Partial<Message>;
};
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Upload coverage
  run: npm run test:coverage
```

## Troubleshooting

### Tests fail with import errors

- Ensure all dependencies are installed: `npm install`
- Check that `ts-jest` is configured correctly in `jest.config.js`

### Database mock issues

- Verify mock is defined before importing module
- Check that mock functions match actual database API

### TypeScript errors in tests

- Ensure `@types/jest` is installed
- Check `tsconfig.json` includes test files

## Best Practices

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - Test names should clearly describe what they test
3. **Test edge cases** - Don't just test the happy path
4. **Mock external dependencies** - Database, HTTP requests, etc.
5. **Clear mocks between tests** - Use `beforeEach(() => jest.clearAllMocks())`
6. **Keep tests simple** - One assertion per test when possible
7. **Test behavior, not implementation** - Focus on what the module does, not how

## References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [Testing Discord.js Bots](https://discordjs.guide/testing/)

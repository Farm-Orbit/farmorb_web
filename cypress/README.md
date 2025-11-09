# Cypress E2E Testing

This directory contains end-to-end (E2E) tests for the FarmOrbit application using Cypress.

## Testing Philosophy

### Integration Testing Approach
- **NO MOCKING in Integration Tests**: Integration tests must test actual API integration
- Integration tests are the first point to discover if APIs work as expected
- Use real API calls to validate service layer functionality
- Test actual HTTP requests/responses, not mocked data
- Integration tests should fail if the API is broken or changed
- Only mock external services (not our own APIs) when necessary

### Test Validation Philosophy
- **Tests must validate expected behavior**: Tests should fail when functionality doesn't work as expected
- **Never accept empty results when expecting data**: If a test expects invitations and gets an empty array, the test should fail
- **Create test data to validate functionality**: Set up proper test scenarios with known data to verify expected outcomes
- **Assert on specific expected values**: Don't just check if arrays exist, verify they contain the expected data
- **Test the complete workflow**: Create data, perform actions, then verify the results match expectations
- **Fail fast on unexpected behavior**: If an API returns empty results when data should exist, the test must fail
- **Validate business logic**: Ensure tests verify that business rules are working correctly, not just that endpoints respond

## Test Structure

```
cypress/
├── e2e/                 # Test files
│   ├── auth-guard.cy.ts
│   ├── signin.cy.ts
│   ├── signup.cy.ts
│   ├── signout.cy.ts
│   ├── farms.cy.ts
│   ├── farm-members.cy.ts
│   ├── animals.cy.ts
│   └── herds.cy.ts (deprecated - use groups.cy.ts)
├── fixtures/            # Test data fixtures
│   ├── api-responses.json
│   └── users.json
└── support/             # Custom commands and configuration
    ├── commands.ts
    └── e2e.ts
```

## Running Tests

### Run all tests
```bash
yarn test:e2e
```

### Run tests in headless mode
```bash
yarn test:e2e:headless
```

### Run specific test file
```bash
yarn cypress run --spec "cypress/e2e/farms.cy.ts"
```

### Open Cypress Test Runner (interactive)
```bash
yarn cypress open
```

## Writing Tests

### Best Practices

1. **Use `data-testid` attributes** for all element selection
2. **Create reusable commands** for common actions (signup, signin)
3. **Test actual functionality**, not just form submission
4. **Show errors when APIs fail** instead of hiding them
5. **Use UI navigation** instead of direct URL navigation
6. **Log API responses** and errors for debugging
7. **Follow DRY principle** - Extract reusable test code into custom commands

### Example Test Structure

```typescript
describe('Farm Management', () => {
  let testEmail: string;
  let farmId: string;

  beforeEach(() => {
    // Set up test data
    const timestamp = Date.now();
    testEmail = `farms${timestamp}@example.com`;
  });

  it('should create a new farm', () => {
    // Register and login
    cy.signup(testEmail, 'password123', 'Test', 'User');
    cy.signin(testEmail, 'password123');

    // Navigate to farms
    cy.get('[data-testid="sidebar-farms-link"]').click();
    
    // Create farm
    cy.get('[data-testid="create-farm-button"]').click();
    cy.get('[data-testid="farm-name-input"]').type('Test Farm');
    cy.get('[data-testid="create-farm-submit-button"]').click();

    // Verify farm was created
    cy.contains('Test Farm').should('be.visible');
  });
});
```

## Custom Commands

### Authentication Commands
- `cy.signup(email, password, firstName, lastName)` - Register a new user
- `cy.signin(email, password)` - Sign in a user
- `cy.signout()` - Sign out the current user

### Navigation Commands
- Use sidebar navigation instead of direct URL navigation
- Example: `cy.get('[data-testid="sidebar-farms-link"]').click()`

## Test Data Management

- Each test should use unique test data (use timestamps)
- Clean up test data after tests complete (if needed)
- Use fixtures for static test data
- Create test users and farms within each test for isolation

## Debugging

### View API Responses
```typescript
cy.intercept('**/api/**').as('apiCall');
cy.wait('@apiCall').then((interception) => {
  console.log('API Response:', interception.response);
});
```

### Log Errors
```typescript
cy.on('fail', (error) => {
  console.error('Test failed:', error);
  throw error;
});
```

## Common Patterns

### Multi-User Testing
```typescript
// Register User A
cy.signup('userA@example.com', 'password', 'User', 'A');
cy.signin('userA@example.com', 'password');

// Create farm and invite User B
cy.createFarm('Test Farm');
cy.inviteMember('userB@example.com');

// Switch to User B
cy.signout();
cy.signup('userB@example.com', 'password', 'User', 'B');
cy.signin('userB@example.com', 'password');

// Accept invitation
cy.acceptInvitation(farmId);
```

### Form Testing
```typescript
// Fill form
cy.get('[data-testid="form-field-input"]').type('value');
cy.get('[data-testid="form-select"]').select('option');
cy.get('[data-testid="form-submit-button"]').click();

// Verify success
cy.contains('Success message').should('be.visible');
```

### Table Testing
```typescript
// Verify table contains data
cy.get('[data-testid="table-row"]').should('have.length.greaterThan', 0);

// Verify specific content
cy.contains('Expected Value').should('be.visible');
```

## Notes

- All tests should be independent and can run in any order
- Tests should clean up after themselves (if necessary)
- Use descriptive test names that explain what is being tested
- Group related tests with `describe` blocks
- Use `beforeEach` for common setup steps
- Avoid test interdependencies

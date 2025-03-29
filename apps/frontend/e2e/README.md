# E2E Tests with Playwright

This directory contains end-to-end tests using Playwright for the frontend application.

## Available Tests

- **Authentication Flow**: Tests the complete auth flow including signup, login, and logout.

## Running Tests

To run all tests:

```bash
# From the frontend directory
npx playwright test

# Or from the root directory
npx playwright test --project=frontend
```

To run a specific test file:

```bash
npx playwright test e2e/auth.spec.ts
```

To run tests in UI mode:

```bash
npx playwright test --ui
```

### Visual Debugging Options

To see tests running in a visible browser:

```bash
# Run with browser visible
npx playwright test e2e/auth.spec.ts --headed

# Run with browser visible and slower execution for debugging
npx playwright test e2e/auth.spec.ts --headed --debug

# Run with specific slowdown (milliseconds)
npx playwright test e2e/auth.spec.ts --headed --slowmo=1000
```

The `--debug` flag will:

- Pause at each step allowing you to inspect the page
- Open the browser's DevTools
- Slow down execution

## Test Structure

- **`e2e/*.spec.ts`**: Test files
- **`e2e/utils/`**: Utility functions and helpers for tests

## Notes

- The tests generate random credentials for each run
- Tests expect the application to be running on `http://localhost:3000` (specified in `playwright.config.ts`)
- Make sure the application is running before executing tests

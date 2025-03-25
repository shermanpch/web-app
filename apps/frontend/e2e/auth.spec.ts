import { test, expect } from '@playwright/test';
import { navigateToSignup, signupUser, loginUser, logoutUser } from './utils/helpers';

// Generate unique test data for each run
const testUser = {
  email: `test-${Math.random().toString(36).substring(2, 8)}@example.com`,
  password: `Test@${Math.random().toString(36).substring(2, 10)}`,
};

test.describe('Authentication Flow', () => {
  test('complete auth flow: signup -> login -> logout', async ({ page }) => {
    // Step 1: Start from homepage and navigate to signup
    await navigateToSignup(page);
    
    // Step 2: Complete signup form
    await signupUser(page, testUser.email, testUser.password);
    
    // Step 3: Complete login form
    await loginUser(page, testUser.email, testUser.password);
    
    // Optional: Verify some element that indicates we're logged in
    // For example, if there's a user profile element or welcome message
    // await expect(page.locator('.user-greeting')).toBeVisible();
    
    // Step 4: Logout
    await logoutUser(page);
  });
});

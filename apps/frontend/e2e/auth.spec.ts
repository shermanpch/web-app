import { test, expect } from "@playwright/test";
import {
  navigateToSignup,
  signupUser,
  loginUser,
  logoutUser,
  navigateToChangePassword,
  changePassword,
} from "./utils/helpers";

// Generate a base for test user data
const generateTestUser = () => ({
  email: `test-${Math.random().toString(36).substring(2, 8)}@example.com`,
  password: `Test@${Math.random().toString(36).substring(2, 10)}`,
});

test.describe("Authentication Flow", () => {
  test("complete auth flow: signup -> login -> logout", async ({ page }) => {
    // Generate unique test user for this test
    const testUser = generateTestUser();

    // Step 1: Start from homepage and navigate to signup
    await navigateToSignup(page);

    // Step 2: Complete signup form
    await signupUser(page, testUser.email, testUser.password);

    // Step 3: Complete login form (includes navigation to login page)
    await loginUser(page, testUser.email, testUser.password);

    // Step 4: Logout
    await logoutUser(page);
  });

  test("password change flow: change password -> logout -> login with new password", async ({
    page,
  }) => {
    // Generate unique test user for this test
    const testUser = generateTestUser();

    // Generate a new password for the test
    const newPassword = `NewTest@${Math.random().toString(36).substring(2, 10)}`;

    // Step 1: Start from homepage and navigate to signup
    await navigateToSignup(page);

    // Step 2: Complete signup form with test user
    await signupUser(page, testUser.email, testUser.password);

    // Step 3: Login with original credentials (includes navigation to login page)
    await loginUser(page, testUser.email, testUser.password);

    // Step 4: Navigate to change password page
    await navigateToChangePassword(page);

    // Step 5: Change password
    await changePassword(page, newPassword);

    // Step 6: We should be redirected to dashboard automatically
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 7: Logout
    await logoutUser(page);

    // Step 8: Login with the new password (includes navigation to login page)
    await loginUser(page, testUser.email, newPassword);

    // Step 9: Verify we're logged in by checking dashboard URL
    await expect(page).toHaveURL(/\/dashboard/);

    // Step 10: Final logout
    await logoutUser(page);
  });
});

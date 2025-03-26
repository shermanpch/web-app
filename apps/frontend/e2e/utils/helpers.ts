import { Page, expect } from '@playwright/test';

/**
 * Helper function to navigate to the signup page from homepage
 */
export async function navigateToSignup(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('link', { name: /get started/i }).click();
  await expect(page).toHaveURL(/\/signup/);
}

/**
 * Helper function to navigate to the login page from homepage
 */
export async function navigateToLogin(page: Page): Promise<void> {
  await page.goto('/');
  console.log('Navigating to login page from homepage...');
  await page.getByRole('link', { name: /sign in|login|log in/i }).click();
  await expect(page).toHaveURL(/\/login/);
  console.log('Successfully navigated to login page');
}

/**
 * Helper function to sign up a user
 */
export async function signupUser(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Helper function to log in a user - starts from homepage
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  // First navigate to the login page
  await navigateToLogin(page);
  
  // Now fill in the login form
  console.log('Filling login form...');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  
  // Click the submit button
  console.log('Submitting login form...');
  const submitButton = page.getByRole('button', { name: /sign in|login|log in/i });
  await submitButton.highlight();  // Highlights the button in headed mode
  await submitButton.click();
  
  // Wait for navigation to complete
  console.log('Waiting for navigation to dashboard...');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  console.log('Successfully logged in and navigated to dashboard');
}

/**
 * Helper function to log out a user
 */
export async function logoutUser(page: Page): Promise<void> {
  await page.getByRole('button', { name: /log ?out|sign ?out/i }).click();
  await expect(page).toHaveURL(/^\/$|\/$/);
}

/**
 * Helper function to navigate to change password page
 */
export async function navigateToChangePassword(page: Page): Promise<void> {
  await page.getByRole('button', { name: /change password/i }).click();
  await expect(page).toHaveURL(/\/dashboard\/change-password/);
}

/**
 * Helper function to change a user's password
 */
export async function changePassword(page: Page, newPassword: string): Promise<void> {
  // Using more specific selectors to avoid ambiguity
  await page.getByLabel('New Password', { exact: true }).fill(newPassword);
  await page.getByLabel('Confirm New Password', { exact: true }).fill(newPassword);
  await page.getByRole('button', { name: /change password/i }).click();
  
  // Wait for success message
  await expect(page.getByText(/password changed successfully/i)).toBeVisible();
  
  // Wait for the automatic redirect to dashboard (timeout increased to handle the redirect)
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
}

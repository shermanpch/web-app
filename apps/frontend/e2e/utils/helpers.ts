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
 * Helper function to sign up a user
 */
export async function signupUser(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign up/i }).click();
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Helper function to log in a user
 */
export async function loginUser(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Helper function to log out a user
 */
export async function logoutUser(page: Page): Promise<void> {
  await page.getByRole('button', { name: /log ?out|sign ?out/i }).click();
  await expect(page).toHaveURL(/^\/$|\/$/);
}

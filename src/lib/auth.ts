// src/lib/auth.ts

/**
 * A centralized list of administrative email addresses.
 * This ensures that admin role checks are consistent across the application.
 */
export const ADMIN_EMAILS = [
  'admin@pacificpapercups.com',
  'admin@pacificcups.com',
];

/**
 * Checks if an email address belongs to an administrator.
 * @param email The email address to check.
 * @returns True if the email is an admin email, false otherwise.
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
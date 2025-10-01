/**
 * Environment variable validation
 * Ensures all required environment variables are present and valid
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
] as const;

const optionalEnvVars = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NODE_ENV',
  'PORT',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'COMPANY_NAME',
  'COMPANY_EMAIL',
  'COMPANY_PHONE',
] as const;

type EnvVars = typeof requiredEnvVars[number];

/**
 * Validates that all required environment variables are set
 * @throws Error if any required environment variable is missing
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\n` +
      `Please check your .env file and ensure all required variables are set.`
    );
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long for security');
  }

  // Validate NODE_ENV
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    console.warn(`⚠️  NODE_ENV should be one of: development, production, test. Got: ${process.env.NODE_ENV}`);
  }
}

/**
 * Gets an environment variable with type safety
 * @param key - The environment variable key
 * @param defaultValue - Optional default value if not set
 */
export function getEnv(key: EnvVars, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value || defaultValue || '';
}

/**
 * Check if we're in production
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if we're in development
 */
export const isDevelopment = process.env.NODE_ENV !== 'production';

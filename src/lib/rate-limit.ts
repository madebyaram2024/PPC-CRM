/**
 * Rate limiting utilities
 * Simple in-memory rate limiter for API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Custom message when rate limit is exceeded
   */
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  message?: string;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  // No entry yet or window has expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime,
    });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Within the time window
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    limit: config.maxRequests,
    remaining: 0,
    resetTime: entry.resetTime,
    message: config.message || 'Too many requests, please try again later.',
  };
}

/**
 * Get client identifier from request
 * Uses IP address or forwarded IP
 */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() :
             request.headers.get('x-real-ip') ||
             'unknown';
  return ip;
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  STRICT: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  // Standard: 30 requests per minute
  STANDARD: {
    maxRequests: 30,
    windowMs: 60 * 1000,
  },
  // Lenient: 100 requests per minute
  LENIENT: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  // Auth: 5 login attempts per 15 minutes
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many login attempts. Please try again later.',
  },
} as const;

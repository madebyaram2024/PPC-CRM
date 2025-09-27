"use client";

import { useEffect } from 'react';

export function ConsoleFilter() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    // Store original console methods
    const originalWarn = console.warn;
    const originalLog = console.log;

    // List of warning patterns to suppress
    const suppressedPatterns = [
      /SES Removing unpermitted intrinsics/,
      /Removing intrinsics\.%DatePrototype%\.toTemporalInstant/,
      /The Components object is deprecated/,
      /lockdown-install\.js/,
      /defaultProps will be removed/,
    ];

    // Helper function to check if message should be suppressed
    const shouldSuppress = (message: string): boolean => {
      return suppressedPatterns.some(pattern => pattern.test(message));
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldSuppress(message)) {
        originalWarn.apply(console, args);
      }
    };

    // Override console.log for certain patterns
    console.log = (...args: any[]) => {
      const message = args.join(' ');
      if (!shouldSuppress(message)) {
        originalLog.apply(console, args);
      }
    };

    // Cleanup function
    return () => {
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);

  return null; // This component doesn't render anything
}
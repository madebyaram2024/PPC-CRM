// Console filter to suppress unwanted warnings in development
export function initConsoleFilter() {
  if (typeof window === 'undefined') return; // Only run on client side

  // Store original console methods
  const originalWarn = console.warn;
  const originalLog = console.log;
  const originalError = console.error;

  // List of warning patterns to suppress
  const suppressedPatterns = [
    /SES Removing unpermitted intrinsics/,
    /Removing intrinsics\.%DatePrototype%\.toTemporalInstant/,
    /The Components object is deprecated/,
    /lockdown-install\.js/,
    /defaultProps will be removed/,
    /ReactDOM.render is no longer supported/,
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

  // Override console.log
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalLog.apply(console, args);
    }
  };

  // Override console.error (be more careful with errors)
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    // Only suppress specific non-critical error patterns
    if (!shouldSuppress(message)) {
      originalError.apply(console, args);
    }
  };

  // Clean up function
  return () => {
    console.warn = originalWarn;
    console.log = originalLog;
    console.error = originalError;
  };
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    // Initialize on page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initConsoleFilter);
    } else {
      initConsoleFilter();
    }
  }
}
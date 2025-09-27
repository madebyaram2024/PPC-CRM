import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  serverExternalPackages: [],
  // Suppress deprecation warnings
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Webpack configuration to suppress warnings
  webpack: (config, { dev, isServer }) => {
    // Suppress specific warnings
    config.ignoreWarnings = [
      // Suppress SES warnings
      /Module not found: Can't resolve 'ses'/,
      // Suppress Components deprecation warnings
      /The Components object is deprecated/,
      // Suppress other React warnings
      /defaultProps will be removed/,
    ];

    // Additional configuration for development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    return config;
  },
};

export default nextConfig;

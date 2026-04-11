import createNextIntlPlugin from "next-intl/plugin"
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Favicon configuration - ensure our favicon is used
  trailingSlash: false,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-dialog'],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // React optimization
  reactStrictMode: true,
  
  // Webpack configuration for react-pdf
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Disable eslint-plugin for PDF generation to avoid issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-pdf/renderer': '@react-pdf/renderer',
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false,
        zlib: false,
      };
    }
    
    return config;
  },
}

export default withNextIntl(nextConfig)

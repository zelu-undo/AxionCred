import createNextIntlPlugin from "next-intl/plugin"
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    domains: ['ogtbegrzbuzophdcdpjm.supabase.co'],
  },
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-dropdown-menu', 
      '@radix-ui/react-select', 
      '@radix-ui/react-dialog',
      '@radix-ui/react-slot',
      'lucide-react',
    ],
    // Optimize CSS
    optimizeCss: true,
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // React optimization
  reactStrictMode: true,
  
  // Enable server components
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },
}

export default withNextIntl(nextConfig)

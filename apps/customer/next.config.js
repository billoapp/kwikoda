/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Ensure CSS is properly processed
    optimizeCss: true,
  },
  // Ensure proper asset handling for mobile
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
  // Enable proper CSS compilation
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'adipa.zendesk.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'https://adipa.zendesk.com/guide-media/:path*',
      },
    ]
  },
}

module.exports = nextConfig

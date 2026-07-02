/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'adipa.zendesk.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' https://www.loom.com https://www.youtube.com https://player.vimeo.com https://fast.wistia.net;",
          },
        ],
      },
    ]
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

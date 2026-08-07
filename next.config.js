/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/hc/:lang/articles/:zendesk_id*',
        destination: '/api/redirect/:zendesk_id',
        permanent: true,
      },
      {
        source: '/hc/:lang*',
        destination: '/',
        permanent: true,
      },
    ]
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
}
module.exports = nextConfig

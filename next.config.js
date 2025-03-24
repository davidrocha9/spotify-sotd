/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'i.scdn.co', 
      'mosaic.scdn.co', 
      'platform-lookaside.fbsbx.com',
      'storage.googleapis.com',
      'images.unsplash.com',
      'www.spotify.com',
      'picsum.photos'
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig 
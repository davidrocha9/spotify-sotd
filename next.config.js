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
      'picsum.photos',
      'upload.wikimedia.org',
      'images.genius.com'
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig 
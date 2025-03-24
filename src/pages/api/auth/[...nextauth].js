import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'

const scopes = [
  'user-read-email',
  'user-read-private',
  'user-read-recently-played',
  'user-top-read'
].join(' ')

export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: { scope: scopes }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // This is similar to your curl example but handled by NextAuth
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      // Return previous token if access token has not expired
      if (Date.now() < token.expiresAt * 1000) {
        return token
      }
      // Access token has expired, refresh it
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.error = token.error
      return session
    }
  },
  pages: {
    signIn: '/'
  }
})

async function refreshAccessToken(token) {
  try {
    const url = 'https://accounts.spotify.com/api/token'
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken
      }),
      method: 'POST'
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
    }
  } catch (error) {
    return {
      ...token,
      error: 'RefreshAccessTokenError'
    }
  }
} 
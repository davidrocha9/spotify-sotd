import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { supabase } from '../../../utils/supabase'
import { v4 as uuidv4 } from 'uuid'
import { createOrGetUser } from "../../../utils/user";

// Add scope for accessing user's listening history
const scopes = [
  "user-read-email",
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-playback-state",
].join(" ");

export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: { scope: scopes },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        // Create or get user from Supabase
        let supabaseUser = null;
        try {
          supabaseUser = await createOrGetUser({
            id: account.providerAccountId || user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          });
        } catch (error) {
          console.error("Error creating/getting Supabase user:", error);
        }

        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          username: account.providerAccountId,
          id: account.providerAccountId || user.id,
          supabaseUserId: supabaseUser?.id || null,
          expiresAt: account.expires_at
            ? Math.floor(Date.now() / 1000 + account.expires_at)
            : Math.floor(Date.now() / 1000 + 3600),
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Add the user ID and tokens to the session
      session.user.id = token.supabaseUserId; // Use Supabase UUID if available
      session.user.spotifyId = token.id; // Keep the Spotify ID separately
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user.username = token.username;

      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  debug: true, // Enable NextAuth debug mode temporarily
});

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
      console.error("Token refresh failed:", refreshedTokens);
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
    }
  } catch (error) {
    console.error("Error refreshing token in NextAuth:", error);
    return {
      ...token,
      error: 'RefreshAccessTokenError'
    }
  }
} 
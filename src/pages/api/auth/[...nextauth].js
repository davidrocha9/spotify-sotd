import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import { supabase } from '../../../utils/supabase'
import { v4 as uuidv4 } from 'uuid'

// Add scope for accessing user's listening history
const scopes = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-playback-state'
].join(' ')

export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'user-read-email user-read-private user-top-read playlist-modify-public playlist-modify-private user-read-recently-played user-read-playback-state'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        console.log("Authentication successful, user data:", { id: user.id, name: user.name });
        
        // Create or update user in Supabase when they sign in
        if (user.id) {
          try {
            // First check if user exists by spotify_id
            console.log("Checking if user exists in Supabase with spotify_id:", user.id);
            
            const { data: existingUser, error: checkError } = await supabase
              .from('users')
              .select('id, spotify_id')
              .eq('spotify_id', user.id)
              .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
              console.error("Error checking for existing user:", checkError.message, checkError.details);
            }
            
            console.log("Existing user check result:", existingUser);
            
            // Store the Supabase UUID in the token for future use
            let supabaseUserId;
            
            // User doesn't exist, create them with a new UUID
            if (!existingUser) {
              console.log("Creating new user in Supabase");
              
              // Generate a proper UUID for Supabase
              supabaseUserId = uuidv4();
              
              const userData = {
                id: supabaseUserId,  // Use proper UUID format
                email: user.email || null,
                spotify_id: user.id,  // Store the Spotify ID here
                display_name: user.name || null,
                avatar_url: user.image || null
              };
              
              console.log("User data to insert:", userData);
              
              const { data: insertResult, error: insertError } = await supabase
                .from('users')
                .insert(userData)
                .select();
                
              if (insertError) {
                console.error("Error creating user:", insertError.message, insertError.details);
                console.error("Full error object:", JSON.stringify(insertError, null, 2));
              } else {
                console.log("User created successfully:", insertResult);
              }
            } else {
              // User exists, use their Supabase UUID
              supabaseUserId = existingUser.id;
              
              console.log("Updating existing user in Supabase");
              
              const { data: updateResult, error: updateError } = await supabase
                .from('users')
                .update({
                  email: user.email || null,
                  display_name: user.name || null,
                  avatar_url: user.image || null
                })
                .eq('id', supabaseUserId)
                .select();
                
              if (updateError) {
                console.error("Error updating user:", updateError.message, updateError.details);
              } else {
                console.log("User updated successfully:", updateResult);
              }
            }
            
            // Save the Supabase UUID to use in the session
            token.supabaseUserId = supabaseUserId;
          } catch (error) {
            console.error('Error syncing user with Supabase:', error.message);
            console.error('Full error object:', JSON.stringify(error, null, 2));
          }
        }
        
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          username: account.providerAccountId,
          accessTokenExpires: account.expires_at * 1000,
          id: user.id
        }
      }

      // Return previous token if not expired yet
      return token
    },
    async session({ session, token }) {
      // Add the user ID and tokens to the session
      session.user.id = token.supabaseUserId || token.id;  // Use Supabase UUID if available
      session.user.spotifyId = token.id;  // Keep the Spotify ID separately
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;
      session.user.username = token.username;
      
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  debug: true, // Enable NextAuth debug mode temporarily
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
import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

// Helper function to make authenticated Spotify API requests
export async function spotifyFetch(url, options = {}) {
  try {
    // Start with current session
    let session = await getSession();
    
    if (!session?.user?.accessToken) {
      console.error('No access token available');
      return null;
    }
    
    // First attempt with current token
    try {
      const response = await axios({
        url: `https://api.spotify.com/v1/${url}`,
        headers: {
          'Authorization': `Bearer ${session.user.accessToken}`,
          ...options.headers
        },
        ...options
      });
      
      return response.data;
    } catch (error) {
      // Check if error is due to expired token
      if (error.response?.status === 401) {
        console.log('Token expired, refreshing...');
        
        // Trigger session refresh via our API endpoint
        try {
          await fetch('/api/auth/refresh', { 
            method: 'POST',
            credentials: 'same-origin'
          });
          
          // Get updated session with new token
          session = await getSession({ force: true });
          
          if (!session?.user?.accessToken) {
            console.error('Failed to refresh token');
            return null;
          }
          
          // Retry request with new token
          const retryResponse = await axios({
            url: `https://api.spotify.com/v1/${url}`,
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`,
              ...options.headers
            },
            ...options
          });
          
          return retryResponse.data;
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          
          // If we can't refresh, sign the user out
          signOut({ callbackUrl: '/' });
          return null;
        }
      }
      
      // For other errors, just throw
      throw error;
    }
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
} 
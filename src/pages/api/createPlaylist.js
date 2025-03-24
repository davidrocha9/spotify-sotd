import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get data from request
    const { accessToken, name, description, songIds } = req.body;

    if (!accessToken || !name || !songIds || songIds.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Step 1: Get the user's Spotify ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!userResponse.ok) {
      return res.status(userResponse.status).json({ 
        error: 'Failed to fetch user data from Spotify' 
      });
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // Step 2: Create a new playlist
    const createPlaylistResponse = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`, 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          description: description,
          public: false
        })
      }
    );

    if (!createPlaylistResponse.ok) {
      return res.status(createPlaylistResponse.status).json({ 
        error: 'Failed to create playlist on Spotify' 
      });
    }

    const playlistData = await createPlaylistResponse.json();
    const playlistId = playlistData.id;

    // Step 3: Add tracks to the playlist (100 tracks max per request)
    for (let i = 0; i < songIds.length; i += 100) {
      const batch = songIds.slice(i, i + 100);
      const trackUris = batch.map(id => `spotify:track:${id}`);
      
      const addTracksResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uris: trackUris
          })
        }
      );

      if (!addTracksResponse.ok) {
        return res.status(addTracksResponse.status).json({ 
          error: 'Failed to add tracks to playlist' 
        });
      }
    }

    return res.status(200).json({ 
      success: true,
      playlistId: playlistId,
      playlistUrl: playlistData.external_urls.spotify
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 
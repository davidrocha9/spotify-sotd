export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { name, description, trackUris, accessToken } = req.body;

  if (!name || !trackUris || !trackUris.length || !accessToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // 1. Get the current user's ID
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user profile');
    }

    const userData = await userResponse.json();
    const userId = userData.id;

    // 2. Create an empty playlist
    const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        public: true,
      }),
    });

    if (!playlistResponse.ok) {
      throw new Error('Failed to create playlist');
    }

    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;
    const playlistUrl = playlistData.external_urls.spotify;

    // 3. Add tracks to the playlist (in batches of 100 if needed)
    const batchSize = 100;
    for (let i = 0; i < trackUris.length; i += batchSize) {
      const batch = trackUris.slice(i, i + batchSize);
      
      const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: batch,
        }),
      });

      if (!addTracksResponse.ok) {
        throw new Error('Failed to add tracks to playlist');
      }
    }

    return res.status(200).json({ 
      success: true, 
      playlistId, 
      playlistUrl 
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return res.status(500).json({ error: error.message || 'Failed to create playlist' });
  }
} 
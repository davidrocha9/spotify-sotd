import axios from 'axios'

// Function to get user's recently played tracks
export const getRecentlyPlayed = async (accessToken) => {
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    return response.data.items
  } catch (error) {
    console.error('Error fetching recently played tracks:', error)
    return []
  }
}

// Function to get user's top tracks
export const getTopTracks = async (accessToken, timeRange = 'short_term', limit = 50) => {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    return response.data.items
  } catch (error) {
    console.error('Error fetching top tracks:', error)
    return []
  }
}

// Function to get track recommendations based on seed tracks
export const getRecommendations = async (accessToken, seedTrackIds, limit = 1) => {
  try {
    // Take up to 5 seed tracks (Spotify API limit)
    const seedTracks = seedTrackIds.slice(0, 5).join(',')
    
    const response = await axios.get(
      `https://api.spotify.com/v1/recommendations?seed_tracks=${seedTracks}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )
    return response.data.tracks
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return []
  }
}

// Add to your spotify.js file
export const getTrackFeatures = async (accessToken, trackId) => {
  try {
    const response = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching track features:', error);
    return {};
  }
};

// Improved function to analyze and determine song of the day
export async function getSongOfTheDay(accessToken) {
  try {
    // Get user's recent and top tracks
    const recentTracks = await getRecentlyPlayed(accessToken)
    const topTracks = await getTopTracks(accessToken, 'short_term', 20)
    
    // If no tracks found, return null
    if (recentTracks.length === 0 && topTracks.length === 0) {
      return null
    }
    
    // STRATEGY 1: Find frequently played tracks in recent history
    const trackFrequency = {}
    const firstListenedAt = {}
    
    // Analyze recently played tracks
    recentTracks.forEach(item => {
      const trackId = item.track.id
      trackFrequency[trackId] = (trackFrequency[trackId] || 0) + 1
      
      // Track when song was first listened to in this dataset
      if (!firstListenedAt[trackId]) {
        firstListenedAt[trackId] = new Date(item.played_at)
      } else {
        const currentDate = new Date(item.played_at)
        if (currentDate < firstListenedAt[trackId]) {
          firstListenedAt[trackId] = currentDate
        }
      }
    })
    
    // STRATEGY 2: Check if the user has discovered new music recently
    const now = new Date()
    const recentlyDiscovered = Object.entries(firstListenedAt)
      .filter(([_, date]) => {
        const daysSinceFirst = (now - date) / (1000 * 60 * 60 * 24)
        return daysSinceFirst < 3 // Discovered in the last 3 days
      })
      .map(([trackId]) => trackId)
    
    // Select song of the day using different strategies
    let songOfTheDay = null
    
    // STRATEGY SELECTION LOGIC
    
    // Strategy 1: If user discovered new music that they've listened to multiple times
    const repeatListenedNewTracks = recentlyDiscovered
      .filter(trackId => trackFrequency[trackId] > 1)
      .sort((a, b) => trackFrequency[b] - trackFrequency[a])
    
    if (repeatListenedNewTracks.length > 0) {
      // Find the track in recent tracks
      const trackId = repeatListenedNewTracks[0]
      songOfTheDay = recentTracks.find(item => item.track.id === trackId)?.track
      console.log("Selected using strategy: New track with repeat listens")
    }
    
    // Strategy 2: If no repeated new tracks, get the most frequently played track
    if (!songOfTheDay) {
      const mostPlayedTrackId = Object.entries(trackFrequency)
        .sort((a, b) => b[1] - a[1])[0]?.[0]
        
      if (mostPlayedTrackId) {
        songOfTheDay = recentTracks.find(item => item.track.id === mostPlayedTrackId)?.track
        console.log("Selected using strategy: Most frequently played track")
      }
    }
    
    // Strategy 3: If still no selection, use top track from user's short-term favorites
    if (!songOfTheDay && topTracks.length > 0) {
      songOfTheDay = topTracks[0]
      console.log("Selected using strategy: Top favorite track")
    }
    
    // Strategy 4: If still no selection, get a recommendation based on recent tracks
    if (!songOfTheDay) {
      // Extract track IDs from recent tracks
      const recentTrackIds = recentTracks.map(item => item.track.id)
      
      // Get recommendations
      const recommendations = await getRecommendations(accessToken, recentTrackIds)
      songOfTheDay = recommendations[0]
      console.log("Selected using strategy: Recommendation based on recent tracks")
    }
    
    return songOfTheDay
  } catch (error) {
    console.error('Error in getSongOfTheDay:', error)
    throw error // Re-throw to be handled by the component
  }
}

// Update getRelatedContent to return both similar artists and tracks
export const getRelatedContent = async (accessToken, trackId, artistId) => {
  try {
    // Get artist details to extract genres
    const artistResponse = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    const mainArtist = artistResponse.data;
    const genres = mainArtist.genres || [];
    
    // SIMILAR ARTISTS COLLECTION
    
    // Approach 1: Get main artist's albums to find collaborating artists
    const albumsResponse = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    // Approach 2: Get search results for similar artists by genre
    let searchQuery = '';
    if (genres.length > 0) {
      // Use the first genre as a search term
      searchQuery = `genre:"${genres[0]}"`;
    } else {
      // If no genres, search by artist name "similar to"
      searchQuery = `similar to ${mainArtist.name}`;
    }
    
    const searchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=15`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    // SIMILAR TRACKS COLLECTION
    
    // Get similar tracks using search
    let trackSearchQuery = '';
    if (genres.length > 0) {
      trackSearchQuery = `genre:"${genres[0]}" NOT artist:"${mainArtist.name}"`;
    } else {
      trackSearchQuery = `similar to ${mainArtist.name}`;
    }
    
    const trackSearchResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(trackSearchQuery)}&type=track&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    // Combine results from different approaches
    const uniqueArtists = [];
    const uniqueTracks = [];
    const seenArtistIds = new Set([artistId]); // Skip the original artist
    const seenTrackIds = new Set([trackId]); // Skip the original track
    
    // Process search results for artists (higher quality matches)
    if (searchResponse.data.artists && searchResponse.data.artists.items) {
      searchResponse.data.artists.items.forEach(artist => {
        if (!seenArtistIds.has(artist.id) && artist.images && artist.images.length > 0) {
          seenArtistIds.add(artist.id);
          uniqueArtists.push(artist);
        }
      });
    }
    
    // Process search results for tracks
    if (trackSearchResponse.data.tracks && trackSearchResponse.data.tracks.items) {
      trackSearchResponse.data.tracks.items.forEach(track => {
        if (!seenTrackIds.has(track.id) && track.album?.images?.length > 0) {
          seenTrackIds.add(track.id);
          uniqueTracks.push(track);
        }
      });
    }
    
    // Process albums to find collaborating artists
    if (albumsResponse.data.items) {
      // Fetch full details for each album to get all artists
      const albumPromises = albumsResponse.data.items.slice(0, 5).map(album => 
        axios.get(`https://api.spotify.com/v1/albums/${album.id}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      );
      
      const albumDetails = await Promise.all(albumPromises);
      
      // Extract artists from each album's tracks
      albumDetails.forEach(response => {
        const album = response.data;
        if (album.tracks && album.tracks.items) {
          album.tracks.items.forEach(track => {
            // Add track to uniqueTracks if not already included
            if (!seenTrackIds.has(track.id)) {
              // Need to add album info manually since album tracks don't include it
              track.album = {
                id: album.id,
                name: album.name,
                images: album.images
              };
              uniqueTracks.push(track);
              seenTrackIds.add(track.id);
            }
            
            // Add artists
            track.artists.forEach(artist => {
              if (!seenArtistIds.has(artist.id)) {
                // Need to fetch full artist details
                fetchArtistDetails(accessToken, artist.id)
                  .then(artistDetails => {
                    if (artistDetails && artistDetails.images && artistDetails.images.length > 0) {
                      uniqueArtists.push(artistDetails);
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('artistDetailsLoaded'));
                      }
                    }
                  })
                  .catch(err => console.error(`Error fetching artist details: ${err}`));
                seenArtistIds.add(artist.id);
              }
            });
          });
        }
      });
    }
    
    console.log(`Found ${uniqueArtists.length} related artists and ${uniqueTracks.length} related tracks`);
    return {
      artists: uniqueArtists.slice(0, 6), // Limit to 6 artists
      tracks: uniqueTracks.slice(0, 6)    // Limit to 6 tracks
    };
  } catch (error) {
    console.error('Error fetching related content:', error);
    return { artists: [], tracks: [] };
  }
};

// Helper function to get full artist details including images
const fetchArtistDetails = async (accessToken, artistId) => {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/artists/${artistId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching artist details for ${artistId}:`, error);
    return null;
  }
};

// Get user stats for a specific song
export const getUserSongStats = async (accessToken, trackId) => {
  try {
    // Get recently played tracks to analyze
    const recentTracks = await getRecentlyPlayed(accessToken, 50);
    
    let playCount = 0;
    let lastPlayed = null;
    
    // Count occurrences of this track and find the most recent play
    recentTracks.forEach(item => {
      if (item.track.id === trackId) {
        playCount++;
        
        const playedAt = new Date(item.played_at);
        if (!lastPlayed || playedAt > lastPlayed) {
          lastPlayed = playedAt;
        }
      }
    });
    
    return {
      playCount,
      lastPlayed: lastPlayed ? lastPlayed.toISOString() : null
    };
  } catch (error) {
    console.error('Error fetching user song stats:', error);
    return { playCount: 0, lastPlayed: null };
  }
}; 
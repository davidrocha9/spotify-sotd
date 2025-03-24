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

// Improved function to analyze and determine song of the day
export const getSongOfTheDay = async (accessToken) => {
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
    console.error('Error determining song of the day:', error)
    return null
  }
} 
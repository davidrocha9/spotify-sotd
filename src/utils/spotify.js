import { spotifyFetch } from './spotifyApi'
import { getSongHistory, saveSongToHistory } from './songHistory'

// Function to get user's recently played tracks
export const getRecentlyPlayed = async (accessToken) => {
  try {
    const data = await spotifyFetch('me/player/recently-played?limit=50')
    return data?.items || []
  } catch (error) {
    console.error('Error fetching recently played tracks:', error)
    return []
  }
}

// Function to get user's top tracks
export const getTopTracks = async (accessToken, timeRange = 'short_term', limit = 50) => {
  try {
    const data = await spotifyFetch(
      `me/top/tracks?time_range=${timeRange}&limit=${limit}`
    )
    return data?.items || []
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
    
    const data = await spotifyFetch(
      `recommendations?seed_tracks=${seedTracks}&limit=${limit}`
    )
    return data?.tracks || []
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return []
  }
}

// Add to your spotify.js file
export const getTrackFeatures = async (accessToken, trackId) => {
  try {
    const response = await spotifyFetch(`audio-features/${trackId}`)
    return response
  } catch (error) {
    console.error('Error fetching track features:', error)
    return {}
  }
}

// Enhanced function to determine song of the day with improved variety
export async function getSongOfTheDay(accessToken, userId) {
  try {   
    // Get user's recent and top tracks
    const recentTracks = await getRecentlyPlayed(accessToken)
    const topTracks = await getTopTracks(accessToken, 'short_term', 20)
    
    // If no tracks found, return null
    if (recentTracks.length === 0 && topTracks.length === 0) {
      return null
    }
    
    // Track frequency analysis
    const trackFrequency = {}
    recentTracks.forEach(item => {
      const trackId = item.track.id
      trackFrequency[trackId] = (trackFrequency[trackId] || 0) + 1
    })
    
    // STEP 1: Get songs used this month to avoid repeats
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    let previouslyRecommended = []
    
    if (userId) {
      try {
        // Get history for current month
        const monthHistory = await getSongHistory(userId, currentMonth, currentYear)
        previouslyRecommended = Object.values(monthHistory).map(song => song.id)
      } catch (error) {
        console.error('Error fetching song history:', error)
        // Continue with empty array if history fetch fails
      }
    }
    
    // STEP 2: Try to find most listened song not previously recommended
    let songOfTheDay = null
    
    // Strategy 1: Most frequently played track not previously recommended
    if (!songOfTheDay) {
      const sortedTracks = Object.entries(trackFrequency)
        .sort((a, b) => b[1] - a[1]) // Sort by play count (descending)
        .filter(([trackId]) => !previouslyRecommended.includes(trackId)) // Filter out previous recommendations
      
      if (sortedTracks.length > 0) {
        const mostPlayedTrackId = sortedTracks[0][0]
        songOfTheDay = recentTracks.find(item => item.track.id === mostPlayedTrackId)?.track
      }
    }
    
    // Strategy 2: Top track from user's favorites (not previously recommended)
    if (!songOfTheDay && topTracks.length > 0) {
      const newTopTrack = topTracks.find(track => !previouslyRecommended.includes(track.id))
      if (newTopTrack) {
        songOfTheDay = newTopTrack
      }
    }
    
    // Strategy 3: If all top tracks have been recommended, use most played anyway
    if (!songOfTheDay) {
      const mostPlayedTrackId = Object.entries(trackFrequency)
        .sort((a, b) => b[1] - a[1])[0]?.[0]
        
      if (mostPlayedTrackId) {
        songOfTheDay = recentTracks.find(item => item.track.id === mostPlayedTrackId)?.track
      }
    }
    
    // Strategy 4: Recommendation based on recent tracks as last resort
    if (!songOfTheDay) {
      const recentTrackIds = recentTracks.map(item => item.track.id)
      const recommendations = await getRecommendations(accessToken, recentTrackIds)
      
      // Filter out previously recommended songs if possible
      const newRecommendation = recommendations.find(track => !previouslyRecommended.includes(track.id)) || recommendations[0]
      
      if (newRecommendation) {
        songOfTheDay = newRecommendation
      }
    }
    
    // Save the song to history if we have a userId
    if (songOfTheDay && userId) {
      try {
        await saveSongToHistory(userId, songOfTheDay)
      } catch (error) {
        console.error('Error saving song to history:', error)
        // Continue even if saving fails
      }
    }
    
    return songOfTheDay
  } catch (error) {
    console.error('Error in getSongOfTheDay:', error)
    throw error
  }
}

// Update getRelatedContent to return both similar artists and tracks
export const getRelatedContent = async (accessToken, trackId, artistId) => {
  try {
    // Get artist details to extract genres
    const artistResponse = await spotifyFetch(
      `artists/${artistId}`
    )
    
    const mainArtist = artistResponse.data
    const genres = mainArtist.genres || []
    
    // SIMILAR ARTISTS COLLECTION
    
    // Approach 1: Get main artist's albums to find collaborating artists
    const albumsResponse = await spotifyFetch(
      `artists/${artistId}/albums?include_groups=album,single&limit=10`
    )
    
    // Approach 2: Get search results for similar artists by genre
    let searchQuery = ''
    if (genres.length > 0) {
      // Use the first genre as a search term
      searchQuery = `genre:"${genres[0]}"`
    } else {
      // If no genres, search by artist name "similar to"
      searchQuery = `similar to ${mainArtist.name}`
    }
    
    const searchResponse = await spotifyFetch(
      `search?q=${encodeURIComponent(searchQuery)}&type=artist&limit=15`
    )
    
    // SIMILAR TRACKS COLLECTION
    
    // Get similar tracks using search
    let trackSearchQuery = ''
    if (genres.length > 0) {
      trackSearchQuery = `genre:"${genres[0]}" NOT artist:"${mainArtist.name}"`
    } else {
      trackSearchQuery = `similar to ${mainArtist.name}`
    }
    
    const trackSearchResponse = await spotifyFetch(
      `search?q=${encodeURIComponent(trackSearchQuery)}&type=track&limit=10`
    )
    
    // Combine results from different approaches
    const uniqueArtists = []
    const uniqueTracks = []
    const seenArtistIds = new Set([artistId]) // Skip the original artist
    const seenTrackIds = new Set([trackId]) // Skip the original track
    
    // Process search results for artists (higher quality matches)
    if (searchResponse.data.artists && searchResponse.data.artists.items) {
      searchResponse.data.artists.items.forEach(artist => {
        if (!seenArtistIds.has(artist.id) && artist.images && artist.images.length > 0) {
          seenArtistIds.add(artist.id)
          uniqueArtists.push(artist)
        }
      })
    }
    
    // Process search results for tracks
    if (trackSearchResponse.data.tracks && trackSearchResponse.data.tracks.items) {
      trackSearchResponse.data.tracks.items.forEach(track => {
        if (!seenTrackIds.has(track.id) && track.album?.images?.length > 0) {
          seenTrackIds.add(track.id)
          uniqueTracks.push(track)
        }
      })
    }
    
    // Process albums to find collaborating artists
    if (albumsResponse.data.items) {
      // Fetch full details for each album to get all artists
      const albumPromises = albumsResponse.data.items.slice(0, 5).map(album => 
        spotifyFetch(`albums/${album.id}`)
      )
      
      const albumDetails = await Promise.all(albumPromises)
      
      // Extract artists from each album's tracks
      albumDetails.forEach(response => {
        const album = response.data
        if (album.tracks && album.tracks.items) {
          album.tracks.items.forEach(track => {
            // Add track to uniqueTracks if not already included
            if (!seenTrackIds.has(track.id)) {
              // Need to add album info manually since album tracks don't include it
              track.album = {
                id: album.id,
                name: album.name,
                images: album.images
              }
              uniqueTracks.push(track)
              seenTrackIds.add(track.id)
            }
            
            // Add artists
            track.artists.forEach(artist => {
              if (!seenArtistIds.has(artist.id)) {
                // Need to fetch full artist details
                fetchArtistDetails(accessToken, artist.id)
                  .then(artistDetails => {
                    if (artistDetails && artistDetails.images && artistDetails.images.length > 0) {
                      uniqueArtists.push(artistDetails)
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('artistDetailsLoaded'))
                      }
                    }
                  })
                  .catch(err => console.error(`Error fetching artist details: ${err}`))
                seenArtistIds.add(artist.id)
              }
            })
          })
        }
      })
    }
    
    return {
      artists: uniqueArtists.slice(0, 6), // Limit to 6 artists
      tracks: uniqueTracks.slice(0, 6)    // Limit to 6 tracks
    }
  } catch (error) {
    console.error('Error fetching related content:', error)
    return { artists: [], tracks: [] }
  }
}

// Helper function to get full artist details including images
const fetchArtistDetails = async (accessToken, artistId) => {
  try {
    const response = await spotifyFetch(
      `artists/${artistId}`
    )
    return response.data
  } catch (error) {
    console.error(`Error fetching artist details for ${artistId}:`, error)
    return null
  }
}

// Get user stats for a specific song
export const getUserSongStats = async (accessToken, trackId) => {
  try {
    // Get recently played tracks to analyze
    const recentTracks = await getRecentlyPlayed(accessToken)
    
    let playCount = 0
    let lastPlayed = null
    
    // Count occurrences of this track and find the most recent play
    recentTracks.forEach(item => {
      if (item.track.id === trackId) {
        playCount++
        
        const playedAt = new Date(item.played_at)
        if (!lastPlayed || playedAt > lastPlayed) {
          lastPlayed = playedAt
        }
      }
    })
    
    return {
      playCount,
      lastPlayed: lastPlayed ? lastPlayed.toISOString() : null
    }
  } catch (error) {
    console.error('Error fetching user song stats:', error)
    return { playCount: 0, lastPlayed: null }
  }
}

export async function getTopItems(type, timeRange = 'short_term', accessToken, limit = 50) {
  const response = await fetch(
    `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch top items')
  }

  return response.json()
}

export async function getGenres(accessToken) {
  const response = await fetch(
    'https://api.spotify.com/v1/recommendations/available-genre-seeds',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch genres')
  }

  const data = await response.json()
  return data.genres
} 
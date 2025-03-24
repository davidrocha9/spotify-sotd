import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getSongOfTheDay, getRelatedContent, getUserSongStats } from '../utils/spotify'
import { saveSongToHistory, checkTodaySong } from '../utils/songHistory'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Dashboard.module.css'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [songOfTheDay, setSongOfTheDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [relatedArtists, setRelatedArtists] = useState([])
  const [relatedTracks, setRelatedTracks] = useState([])
  const [userStats, setUserStats] = useState(null)
  const [relatedArtistsLoaded, setRelatedArtistsLoaded] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }

    if (session?.user?.accessToken && !dataLoaded) {
      // Only check for existing song if we haven't already loaded the data
      checkForExistingSong();
    }
  }, [session, status, router, dataLoaded])

  useEffect(() => {
    const handleArtistsLoaded = () => {
      // Update state to trigger re-render when artists are loaded
      setRelatedArtistsLoaded(prev => !prev);
    };
    
    window.addEventListener('artistDetailsLoaded', handleArtistsLoaded);
    
    return () => {
      window.removeEventListener('artistDetailsLoaded', handleArtistsLoaded);
    };
  }, []);

  // Add a visibility change event listener to handle tab switches properly
  useEffect(() => {
    // Handler for visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // We've become visible again, but we don't need to reload
        // The dataLoaded state prevents unnecessary data fetching
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Helper function to check if user already has revealed a song today
  const checkForExistingSong = async () => {
    try {
      // Set this flag to prevent reloading when switching tabs
      setDataLoaded(true);
      
      if (session?.user?.id) {
        // Check if user already has a song for today
        const { exists } = await checkTodaySong(session.user.id);
        
        if (exists) {
          // If song already exists, mark it as revealed
          setRevealed(true);
        }
      }
      
      // Always fetch the song of the day (either to show it directly or behind reveal button)
      fetchSongOfTheDay();
    } catch (error) {
      console.error('Error checking for existing song:', error);
      fetchSongOfTheDay();
    }
  };

  const fetchSongOfTheDay = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const song = await getSongOfTheDay(session.user.accessToken)
      setSongOfTheDay(song)
      
      // Get similar artists and tracks based on the song and artist
      if (song?.id && song?.artists?.[0]?.id) {
        const relatedContent = await getRelatedContent(
          session.user.accessToken, 
          song.id,
          song.artists[0].id
        );
        setRelatedArtists(relatedContent.artists);
        setRelatedTracks(relatedContent.tracks);
      }
      
      // Get user stats for this song
      if (song?.id) {
        const stats = await getUserSongStats(session.user.accessToken, song.id)
        setUserStats(stats)
      }
    } catch (err) {
      console.error('Error fetching song of the day:', err)
      setError('Failed to fetch your song recommendation. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const revealSong = async () => {
    setRevealed(true)
    
    // Save the song to history when revealed
    if (session?.user?.id && songOfTheDay) {
      try {
        await saveSongToHistory(session.user.id, songOfTheDay)
      } catch (error) {
        console.error('Error saving song history:', error)
        // Continue with the UI flow even if saving fails
      }
    }
  }

  const submitFeedback = async (feedback) => {
    // Implement the logic to submit feedback to the server
    console.log(`Feedback submitted: ${feedback}`)
  }

  const shareSong = (platform) => {
    // Implement the logic to share the song on a given platform
    console.log(`Sharing song on ${platform}`)
  }

  const copyShareLink = () => {
    // Implement the logic to copy the share link
    console.log('Copying share link')
  }

  // Add this helper function to format Spotify URIs
  const getSpotifyURI = (trackId) => {
    return `spotify:track:${trackId}`;
  };

  // Add this enhanced function to determine the most appropriate link
  const getSpotifyLink = (trackId) => {
    // Native URI (will open app if installed)
    const spotifyURI = `spotify:track:${trackId}`;
    
    // Web fallback URL
    const webURL = `https://open.spotify.com/track/${trackId}`;
    
    // For mobile devices, prefer native app URI
    if (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return spotifyURI;
    }
    
    return spotifyURI; // Prefer native app on all platforms
  };

  if (status === 'loading') {
    return <div className={styles.loadingScreen}><div className={styles.loader}></div></div>
  }

  return (
    <>
      <Head>
        <title>Your Song of the Day | Spotify Song of the Day</title>
        <meta name="description" content="Discover your daily song recommendation based on your Spotify listening history" />
      </Head>

      <div className={styles.gradientBg}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.heading}>Your Song of the Day</h1>
          </header>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.pulsingDisc}>
                <i className="fas fa-compact-disc fa-spin"></i>
              </div>
              <p>Finding your perfect track...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>
                <i className="fas fa-exclamation"></i>
              </div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button 
                className={styles.retryButton} 
                onClick={fetchSongOfTheDay}
              >
                Try Again
              </button>
            </div>
          ) : songOfTheDay ? (
            <div className={styles.songSection}>
              <div className={`${styles.blurredCard} ${revealed ? styles.revealed : ''}`}>
                {!revealed ? (
                  <div className={styles.revealContainer}>
                    <div className={styles.revealIcon}>
                      <i className="fas fa-gift"></i>
                    </div>
                    <h2>Your Song of the Day is Ready!</h2>
                    <p>We've selected the perfect track just for you today</p>
                    <button 
                      className={styles.revealButton}
                      onClick={revealSong}
                    >
                      Reveal Song
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.songCard}>
                      <div className={styles.albumArtContainer}>
                        {songOfTheDay.album.images?.[0]?.url && (
                          <div className={styles.albumImageWrapper}>
                            <Image 
                              src={songOfTheDay.album.images[0].url} 
                              alt={`${songOfTheDay.name} album art`}
                              width={300}
                              height={300}
                              className={styles.cover}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.content}>
                        <div className={styles.trackDetails}>
                          <h2 className={styles.title}>{songOfTheDay.name}</h2>
                          <p className={styles.artist}>{songOfTheDay.artists.map(artist => artist.name).join(', ')}</p>
                          
                          <div className={styles.metaInfo}>
                            <div className={styles.metaItem}>
                              <i className="fas fa-compact-disc"></i>
                              <span>{songOfTheDay.album.name}</span>
                            </div>
                            
                            {songOfTheDay.duration_ms && (
                              <div className={styles.metaItem}>
                                <i className="fas fa-clock"></i>
                                <span>{formatDuration(songOfTheDay.duration_ms)}</span>
                              </div>
                            )}
                            
                            {songOfTheDay.popularity && (
                              <div className={styles.metaItem}>
                                <i className="fas fa-chart-line"></i>
                                <span>Popularity: {songOfTheDay.popularity}/100</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className={styles.actions}>
                          <a 
                            href={getSpotifyLink(songOfTheDay.id)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.listenButton}
                          >
                            <i className="fab fa-spotify"></i>
                            <span>Play on Spotify</span>
                          </a>
                          
                          <a 
                            href={`https://open.spotify.com/album/${songOfTheDay.album.id}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={styles.albumButton}
                          >
                            <i className="fas fa-record-vinyl"></i>
                            <span>View Album</span>
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.additionalContent}>
                      <div className={styles.infoCard}>
                        <div className={styles.userStats}>
                          <h3>Your Listening Stats</h3>
                          <div className={styles.statsList}>
                            {userStats ? (
                              <>
                                <div className={styles.statItem}>
                                  <i className="fas fa-calendar-check"></i>
                                  <span>Last played: {userStats.lastPlayed ? new Date(userStats.lastPlayed).toLocaleDateString() : 'Never played'}</span>
                                </div>
                                <div className={styles.statItem}>
                                  <i className="fas fa-play-circle"></i>
                                  <span>Played {userStats.playCount || 0} times in the last 30 days</span>
                                </div>
                                <div className={styles.statItem}>
                                  <i className="fas fa-chart-line"></i>
                                  <span>{userStats.playCount > 3 ? 'You love this track!' : userStats.playCount > 0 ? 'Getting familiar with this one' : 'New discovery for you'}</span>
                                </div>
                              </>
                            ) : (
                              <p className={styles.emptyStats}>We're tracking your listening habits to provide personalized insights.</p>
                            )}
                          </div>
                        </div>
                        
                        <div className={styles.shareSong}>
                          <h3>Share This Discovery</h3>
                          <div className={styles.shareButtons}>
                            <button className={styles.shareButton} onClick={() => shareSong('twitter')}>
                              <i className="fab fa-twitter"></i> Twitter
                            </button>
                            <button className={styles.copyButton} onClick={() => copyShareLink()}>
                              <i className="fas fa-link"></i> Copy Link
                            </button>
                          </div>
                        </div>
                        
                        <div className={styles.feedbackSection}>
                          <h3>Help Us Improve Your Recommendations</h3>
                          <div className={styles.feedbackButtons}>
                            <button className={styles.likeButton} onClick={() => submitFeedback('like')}>
                              <i className="fas fa-thumbs-up"></i> Love It
                            </button>
                            <button className={styles.dislikeButton} onClick={() => submitFeedback('dislike')}>
                              <i className="fas fa-thumbs-down"></i> Not For Me
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={styles.infoCard}>
                        <div className={styles.relatedSection}>
                          <h3>Similar Artists</h3>
                          <div className={styles.artistsGrid}>
                            {relatedArtists.length > 0 ? (
                              relatedArtists.map(artist => (
                                <a 
                                  key={artist.id}
                                  href={artist.external_urls?.spotify} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.artistCard}
                                >
                                  {artist.images?.[0]?.url && (
                                    <div className={styles.artistImage}>
                                      <Image
                                        src={artist.images[0].url}
                                        alt={artist.name}
                                        width={60}
                                        height={60}
                                      />
                                    </div>
                                  )}
                                  <span>{artist.name}</span>
                                </a>
                              ))
                            ) : (
                              <p className={styles.emptyItems}>Looking for similar artists...</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.infoCard}>
                        <div className={styles.relatedSection}>
                          <h3>Similar Tracks</h3>
                          <div className={styles.tracksGrid}>
                            {relatedTracks.length > 0 ? (
                              relatedTracks.map(track => (
                                <a 
                                  key={track.id}
                                  href={track.external_urls?.spotify} 
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.trackCard}
                                >
                                  {track.album?.images?.[0]?.url && (
                                    <div className={styles.trackImage}>
                                      <Image
                                        src={track.album.images[0].url}
                                        alt={`${track.name} album art`}
                                        width={50}
                                        height={50}
                                      />
                                    </div>
                                  )}
                                  <div className={styles.trackInfo}>
                                    <span className={styles.trackName}>{track.name}</span>
                                    <span className={styles.trackArtist}>
                                      {track.artists.map(a => a.name).join(', ')}
                                    </span>
                                  </div>
                                </a>
                              ))
                            ) : (
                              <p className={styles.emptyItems}>Looking for similar tracks...</p>
                            )}
                          </div>
                        </div>
                        
                        {songOfTheDay.preview_url && (
                          <div className={styles.previewPlayer}>
                            <h3>Listen to Preview</h3>
                            <audio controls src={songOfTheDay.preview_url} className={styles.audioPlayer}>
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.noSongContainer}>
              <div className={styles.emptyIcon}>
                <i className="fas fa-headphones"></i>
              </div>
              <h3>No recommendations available</h3>
              <p>We couldn't find a song recommendation based on your listening history. Try listening to more music on Spotify and check back later!</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
} 
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getSongOfTheDay } from '../utils/spotify'
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }

    if (session?.accessToken) {
      fetchSongOfTheDay()
    }
  }, [session, status, router])

  const fetchSongOfTheDay = async () => {
    try {
      setLoading(true)
      setError(null)
      setRevealed(false)
      
      const song = await getSongOfTheDay(session.accessToken)
      setSongOfTheDay(song)
    } catch (err) {
      console.error('Error fetching song of the day:', err)
      setError('Failed to fetch your song recommendation. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const revealSong = () => {
    setRevealed(true)
  }

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
                            <div className={styles.playOverlay}>
                              <i className="fas fa-play"></i>
                            </div>
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
                            href={songOfTheDay.external_urls.spotify} 
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
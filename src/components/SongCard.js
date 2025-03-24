import Image from 'next/image'
import styles from '../styles/SongCard.module.css'

export default function SongCard({ song }) {
  if (!song) return null
  
  // Format duration from milliseconds to MM:SS format
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className={styles.card}>
      <div className={styles.albumArtContainer}>
        {song.album.images?.[0]?.url && (
          <div className={styles.albumImageWrapper}>
            <Image 
              src={song.album.images[0].url} 
              alt={`${song.name} album art`}
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
          <h2 className={styles.title}>{song.name}</h2>
          <p className={styles.artist}>{song.artists.map(artist => artist.name).join(', ')}</p>
          
          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <i className="fas fa-compact-disc"></i>
              <span>{song.album.name}</span>
            </div>
            
            {song.duration_ms && (
              <div className={styles.metaItem}>
                <i className="fas fa-clock"></i>
                <span>{formatDuration(song.duration_ms)}</span>
              </div>
            )}
            
            {song.popularity && (
              <div className={styles.metaItem}>
                <i className="fas fa-chart-line"></i>
                <span>Popularity: {song.popularity}/100</span>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.actions}>
          <a 
            href={song.external_urls.spotify} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.listenButton}
          >
            <i className="fab fa-spotify"></i>
            <span>Play on Spotify</span>
          </a>
          
          <a 
            href={`https://open.spotify.com/album/${song.album.id}`}
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
  )
} 
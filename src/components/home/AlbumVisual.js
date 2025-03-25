import Image from 'next/image';
import styles from '../../styles/Home.module.css';

export function AlbumVisual({ currentAlbum, isTransitioning }) {
  return (
    <div className={styles.visual}>
      <div className={styles.musicControls}>
        <div className={`${styles.albumCover} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
          <Image 
            src={currentAlbum.url}
            alt={`${currentAlbum.name} by ${currentAlbum.artist}`}
            width={550}
            height={550}
            className={styles.albumImage}
          />
        </div>
        
        <div className={`${styles.playerControls} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
          <div className={styles.trackInfo}>
            <span className={styles.trackName}>{currentAlbum.name}</span>
            <span className={styles.artistName}>{currentAlbum.artist}</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progress}></div>
          </div>
          <div className={styles.controls}>
            <i className="fas fa-step-backward"></i>
            <i className="fas fa-play-circle fa-2x"></i>
            <i className="fas fa-step-forward"></i>
          </div>
        </div>
      </div>
    </div>
  );
} 
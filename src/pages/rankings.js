import { useRouter } from 'next/router';
import styles from '../styles/Rankings.module.css';

export default function Rankings() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Spotify Rankings</h1>
      </header>

      <div className={styles.cardsContainer}>
        <div 
          className={`${styles.card} ${styles.cardSongs}`}
          onClick={() => router.push('/rankings/songs')}
        >
          <div className={styles.cardOverlay}>
            <i className={`fas fa-music ${styles.cardIcon}`}></i>
            <h2 className={styles.cardTitle}>Top Songs</h2>
            <p className={styles.cardDescription}>
              Discover your most played tracks
            </p>
          </div>
        </div>

        <div 
          className={`${styles.card} ${styles.cardArtists}`}
          onClick={() => router.push('/rankings/artists')}
        >
          <div className={styles.cardOverlay}>
            <i className={`fas fa-user ${styles.cardIcon}`}></i>
            <h2 className={styles.cardTitle}>Top Artists</h2>
            <p className={styles.cardDescription}>
              Explore your favorite artists
            </p>
          </div>
        </div>

        <div 
          className={`${styles.card} ${styles.cardGenres}`}
          onClick={() => router.push('/rankings/genres')}
        >
          <div className={styles.cardOverlay}>
            <i className={`fas fa-guitar ${styles.cardIcon}`}></i>
            <h2 className={styles.cardTitle}>Top Genres</h2>
            <p className={styles.cardDescription}>
              Browse your music genres
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 
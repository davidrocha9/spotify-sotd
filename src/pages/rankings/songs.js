import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../../styles/RankingDetail.module.css';
import { getTopItems } from '../../utils/spotify';

export default function TopSongs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('short_term');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSongs = async () => {
      console.log("fetching songs", status , session)
      if (status === 'authenticated' && session?.user?.accessToken) {
        setIsLoading(true);
        try {
          console.log("fetching songs")
          const data = await getTopItems('tracks', timeRange, session?.user?.accessToken);
          setSongs(data.items || []);
        } catch (error) {
          console.error('Error fetching songs:', error);
          setSongs([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSongs();
  }, [session, timeRange, status]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  // Show nothing if not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Top Songs</h1>
        <div className={styles.timeRanges}>
          <button 
            className={`${styles.timeButton} ${timeRange === 'short_term' ? styles.active : ''}`}
            onClick={() => setTimeRange('short_term')}
          >
            Last Month
          </button>
          <button 
            className={`${styles.timeButton} ${timeRange === 'medium_term' ? styles.active : ''}`}
            onClick={() => setTimeRange('medium_term')}
          >
            Last 6 Months
          </button>
          <button 
            className={`${styles.timeButton} ${timeRange === 'long_term' ? styles.active : ''}`}
            onClick={() => setTimeRange('long_term')}
          >
            All Time
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          <div className={styles.podium}>
            {songs.slice(0, 3).map((song, index) => (
              <div 
                key={song.id} 
                className={`${styles.podiumItem} ${styles[`podium${['First', 'Second', 'Third'][index]}`]}`}
              >
                <div className={styles.podiumStand}>
                  <div className={styles.podiumRank}>#{index + 1}</div>
                  <div className={styles.imageContainer}>
                    <img 
                      src={song.album.images[0]?.url} 
                      alt={song.name}
                      className={styles.image}
                    />
                  </div>
                  <div className={styles.info}>
                    <h3 className={styles.name}>{song.name}</h3>
                    <p className={styles.artist}>{song.artists[0].name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* List for remaining songs */}
          <div className={styles.list}>
            {songs.slice(3).map((song, index) => (
              <div key={song.id} className={styles.listItem}>
                <div className={styles.rank}>#{index + 4}</div>
                <div className={styles.imageContainer}>
                  <img 
                    src={song.album.images[0]?.url} 
                    alt={song.name}
                    className={styles.image}
                  />
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{song.name}</h3>
                  <p className={styles.artist}>{song.artists[0].name}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 
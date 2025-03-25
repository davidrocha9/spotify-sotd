import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../../styles/RankingDetail.module.css';
import { getTopItems } from '../../utils/spotify';

export default function TopArtists() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('short_term');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchArtists = async () => {
      if (status === 'authenticated' && session?.user?.accessToken) {
        setIsLoading(true);
        try {
          const data = await getTopItems('artists', timeRange, session.user.accessToken);
          setArtists(data.items || []);
        } catch (error) {
          console.error('Error fetching artists:', error);
          setArtists([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchArtists();
  }, [session, timeRange, status]);

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Top Artists</h1>
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
            {artists.slice(0, 3).map((artist, index) => (
              <div 
                key={artist.id} 
                className={`${styles.podiumItem} ${styles[`podium${['First', 'Second', 'Third'][index]}`]}`}
              >
                <div className={styles.podiumStand}>
                  <div className={styles.podiumRank}>#{index + 1}</div>
                  <div className={styles.imageContainer}>
                    <img 
                      src={artist.images[0]?.url} 
                      alt={artist.name}
                      className={styles.image}
                    />
                  </div>
                  <div className={styles.info}>
                    <h3 className={styles.name}>{artist.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* List for remaining artists */}
          <div className={styles.list}>
            {artists.slice(3).map((artist, index) => (
              <div key={artist.id} className={styles.listItem}>
                <div className={styles.rank}>#{index + 4}</div>
                <div className={styles.imageContainer}>
                  <img 
                    src={artist.images[0]?.url} 
                    alt={artist.name}
                    className={styles.image}
                  />
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{artist.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import styles from '../../styles/RankingDetail.module.css';
import { getTopItems } from '../../utils/spotify';

export default function TopGenres() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchGenres = async () => {
      if (status === 'authenticated' && session?.user?.accessToken) {
        setIsLoading(true);
        try {
          const data = await getTopItems('artists', 'long_term', session.user.accessToken, 50);
          const allGenres = data.items.flatMap(artist => artist.genres);
          
          // Count genre occurrences
          const genreCounts = allGenres.reduce((acc, genre) => {
            acc[genre] = (acc[genre] || 0) + 1;
            return acc;
          }, {});

          // Convert to array and sort
          const sortedGenres = Object.entries(genreCounts)
            .map(([name, count]) => ({ 
              id: name,
              name
            }))
            .sort((a, b) => genreCounts[b.name] - genreCounts[a.name]);

          setGenres(sortedGenres);
        } catch (error) {
          console.error('Error fetching genres:', error);
          setGenres([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchGenres();
  }, [session, status]);

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
        <h1 className={styles.heading}>Top Genres</h1>
      </header>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          <div className={styles.podium}>
            {genres.slice(0, 3).map((genre, index) => (
              <div 
                key={genre.id} 
                className={`${styles.podiumItem} ${styles[`podium${['First', 'Second', 'Third'][index]}`]}`}
              >
                <div className={styles.podiumStand}>
                  <div className={styles.podiumRank}>#{index + 1}</div>
                  <div className={styles.info}>
                    <h3 className={styles.name}>{genre.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* List for remaining genres */}
          <div className={styles.list}>
            {genres.slice(3).map((genre, index) => (
              <div key={genre.id} className={styles.listItem}>
                <div className={styles.rank}>#{index + 4}</div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{genre.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 
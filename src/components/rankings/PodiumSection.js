import styles from '../../styles/RankingDetail.module.css';
import Image from 'next/image';

export function PodiumSection({ items, type }) {
  return (
    <div className={styles.podium}>
      {items.slice(0, 3).map((item, index) => (
        <div 
          key={item.id} 
          className={`${styles.podiumItem} ${styles[`podium${['First', 'Second', 'Third'][index]}`]}`}
        >
          <div className={styles.podiumStand}>
            <div className={styles.podiumRank}>#{index + 1}</div>
            {type !== 'genres' && (
              <div className={styles.imageContainer}>
                <Image 
                  src={item.images?.[0]?.url || item.album?.images?.[0]?.url} 
                  alt={item.name}
                  width={300}
                  height={300}
                  className={styles.image}
                />
              </div>
            )}
            <div className={styles.info}>
              <h3 className={styles.name}>{item.name}</h3>
              {type === 'songs' && (
                <p className={styles.artist}>{item.artists[0].name}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 
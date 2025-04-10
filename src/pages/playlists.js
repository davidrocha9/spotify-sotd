import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Playlists.module.css";
import { getAvailableMonths } from "../utils/songHistory";

export default function Playlists() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [availableMonths, setAvailableMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Month names for display
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }

    const fetchAvailableMonths = async () => {
      if (session?.user?.id) {
        setLoading(true);
        try {
          const months = await getAvailableMonths(session.user.id);
          setAvailableMonths(months);
        } catch (error) {
          console.error("Error fetching available months:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session?.user?.id) {
      fetchAvailableMonths();
    }
  }, [session, status, router]);

  // Get available years from the data
  const availableYears = [...new Set(availableMonths.map((m) => m.year))];

  // Always include current year if no data
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear());
  }

  // Sort years in descending order
  const sortedYears = availableYears.sort((a, b) => b - a);

  // Create an object to easily lookup song counts for specific months
  const monthsLookup = {};
  availableMonths.forEach(({ year, month, songCount }) => {
    const key = `${year}-${month}`;
    monthsLookup[key] = songCount;
  });

  // Handle year change
  const changeYear = (year) => {
    setSelectedYear(year);
  };

  if (status === "loading") {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Monthly Playlists | Spotify Song of the Day</title>
        <meta name="description" content="Browse and listen to your monthly playlists of recommended songs" />
      </Head>

      <div className={styles.gradientBg}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h1 className={styles.heading}>Monthly Playlists</h1>
            <p className={styles.subheading}>Browse your song collections by month</p>
          </header>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading your playlists...</p>
            </div>
          ) : (
            <>
              {/* Year selector */}
              {sortedYears.length > 1 && (
                <div className={styles.yearSelector}>
                  {sortedYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => changeYear(year)}
                      className={`${styles.yearButton} ${selectedYear === year ? styles.activeYear : ""}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              )}

              <div className={styles.playlistsContainer}>
                <div className={styles.yearSection}>
                  <h2 className={styles.yearHeading}>{selectedYear}</h2>
                  <div className={styles.monthsGrid}>
                    {/* Always show all 12 months */}
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                      const key = `${selectedYear}-${month}`;
                      const songCount = monthsLookup[key] || 0;
                      const isEmpty = songCount === 0;

                      return (
                        <Link
                          href={isEmpty ? "#" : `/playlists/${selectedYear}/${month}`}
                          key={key}
                          className={`${styles.monthCard} ${isEmpty ? styles.emptyMonth : ""}`}
                          onClick={(e) => isEmpty && e.preventDefault()}
                        >
                          <div className={styles.monthContent}>
                            <h3 className={styles.monthName}>{monthNames[month - 1]}</h3>
                            <div className={styles.songsCount}>
                              <i className={`fas fa-music ${isEmpty ? styles.emptyIcon : ""}`}></i>
                              <span>
                                {songCount} {songCount === 1 ? "song" : "songs"}
                              </span>
                            </div>
                            <div className={styles.cardFooter}>
                              {isEmpty ? (
                                <span className={styles.emptyLabel}>No songs yet</span>
                              ) : (
                                <span className={styles.viewButton}>
                                  <i className="fas fa-headphones"></i> Listen
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

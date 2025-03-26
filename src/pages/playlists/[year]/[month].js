import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "../../../styles/MonthPlaylist.module.css";
import { getSongHistory } from "../../../utils/songHistory";
import { createPlaylist } from "../../../utils/spotify";

export default function MonthPlaylist() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { year, month } = router.query;

  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState(null);

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

    const fetchSongs = async () => {
      if (session?.user?.id && year && month) {
        setLoading(true);
        try {
          const history = await getSongHistory(session.user.id, parseInt(month) - 1, parseInt(year));
          // Convert object to array and sort by date
          const songsArray = Object.entries(history)
            .map(([date, song]) => ({
              date,
              ...song,
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          setSongs(songsArray);
        } catch (error) {
          console.error("Error fetching songs for month:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (session?.user?.id && year && month) {
      fetchSongs();
    }
  }, [session, status, router, year, month]);

  const handleCreatePlaylist = async () => {
    if (songs.length === 0 || !session?.user?.id) return;

    setCreatingPlaylist(true);
    try {
      // Collect track URIs
      const trackUris = songs.map((song) => `spotify:track:${song.id}`);

      // Create a playlist
      const playlist = await createPlaylist(
        session.user.id,
        `Song of the Day - ${monthNames[parseInt(month) - 1]} ${year}`,
        `A collection of daily song recommendations for ${monthNames[parseInt(month) - 1]} ${year}`,
        trackUris
      );

      if (playlist?.external_urls?.spotify) {
        setPlaylistUrl(playlist.external_urls.spotify);
      }
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setCreatingPlaylist(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  if (status === "loading" || !year || !month) {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{`${monthNames[parseInt(month) - 1]} ${year} Playlist | Spotify Song of the Day`}</title>
        <meta
          name="description"
          content={`Listen to your daily song recommendations from ${monthNames[parseInt(month) - 1]} ${year}`}
        />
      </Head>

      <div className={styles.gradientBg}>
        <div className={styles.container}>
          <div className={styles.header}>
            <Link href="/playlists" className={styles.backButton}>
              <i className="fas fa-arrow-left"></i> Back to Playlists
            </Link>
            <h1 className={styles.heading}>
              {monthNames[parseInt(month) - 1]} {year} Playlist
            </h1>
            <div className={styles.playlistActions}>
              {playlistUrl ? (
                <a href={playlistUrl} target="_blank" rel="noopener noreferrer" className={styles.openPlaylistButton}>
                  <i className="fab fa-spotify"></i> Open in Spotify
                </a>
              ) : (
                <button
                  className={styles.createPlaylistButton}
                  onClick={handleCreatePlaylist}
                  disabled={creatingPlaylist || songs.length === 0}
                >
                  {creatingPlaylist ? (
                    <>
                      <div className={styles.smallLoader}></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      <span>Export to Spotify</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loader}></div>
              <p>Loading your songs...</p>
            </div>
          ) : songs.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <i className="fas fa-music"></i>
              </div>
              <h3>No Songs Found</h3>
              <p>There are no song recommendations for this month yet.</p>
              <Link href="/dashboard" className={styles.emptyButton}>
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className={styles.playlistContainer}>
              <div className={styles.songsList}>
                {songs.map((song, index) => (
                  <div key={`${song.id}-${index}`} className={styles.songCard}>
                    <div className={styles.songNumber}>{index + 1}</div>

                    <div className={styles.songImage}>
                      {song.album && song.album.images && song.album.images[0] && (
                        <Image
                          src={song.album.images[0].url}
                          alt={`${song.name} album art`}
                          width={60}
                          height={60}
                          className={styles.albumCover}
                        />
                      )}
                    </div>

                    <div className={styles.songInfo}>
                      <div className={styles.songNameDate}>
                        <h3 className={styles.songName}>{song.name}</h3>
                        <span className={styles.songDate}>{formatDate(song.date)}</span>
                      </div>
                      <div className={styles.artistName}>
                        {Array.isArray(song.artists) ? song.artists.map((a) => a.name).join(", ") : song.artists}
                      </div>
                    </div>

                    <div className={styles.songActions}>
                      <a
                        href={song.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.playButton}
                      >
                        <i className="fas fa-play"></i>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

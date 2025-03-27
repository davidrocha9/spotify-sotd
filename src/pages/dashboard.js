import { useSession, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState, useCallback } from 'react'
import { getSongOfTheDay, getRelatedContent, getUserSongStats } from '../utils/spotify'
import { saveSongToHistory, checkTodaySong } from '../utils/songHistory'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Dashboard.module.css'
import Toast from "../components/Toast";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [songOfTheDay, setSongOfTheDay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [relatedArtists, setRelatedArtists] = useState([]);
  const [relatedTracks, setRelatedTracks] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [relatedArtistsLoaded, setRelatedArtistsLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }

    if (session?.user?.accessToken && !dataLoaded) {
      // Only check for existing song if we haven't already loaded the data
      checkForExistingSong();
    }
  }, [session, status, router, dataLoaded]);

  useEffect(() => {
    const handleArtistsLoaded = () => {
      // Update state to trigger re-render when artists are loaded
      setRelatedArtistsLoaded((prev) => !prev);
    };

    window.addEventListener("artistDetailsLoaded", handleArtistsLoaded);

    return () => {
      window.removeEventListener("artistDetailsLoaded", handleArtistsLoaded);
    };
  }, []);

  // Add a visibility change event listener to handle tab switches properly
  useEffect(() => {
    // Handler for visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // We've become visible again, but we don't need to reload
        // The dataLoaded state prevents unnecessary data fetching
      }
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Update the checkForExistingSong function to properly handle existing songs
  const checkForExistingSong = async () => {
    try {
      // Set this flag to prevent reloading when switching tabs
      setDataLoaded(true);
      setLoading(true);

      console.log("Session:", session);

      if (session?.user?.id) {
        console.log("Checking for existing song for user:", session.user.id);
        // Check if user already has a song for today
        const { exists, song } = await checkTodaySong(session.user.id);

        console.log("Song exists for today:", exists);
        if (exists && song) {
          // If song already exists, use it and mark it as revealed
          setSongOfTheDay(song);
          setRevealed(true);
          setLoading(false);

          // Also fetch related content and stats for the existing song
          fetchRelatedContentAndStats(song);
          return;
        }
      }

      // Only fetch a new song if we didn't find one in the database
      await fetchSongOfTheDay();
    } catch (error) {
      console.error("Error checking for existing song:", error);
      await fetchSongOfTheDay();
    }
  };

  // Extract the related content and stats fetching to a separate function
  const fetchRelatedContentAndStats = async (song) => {
    try {
      // Get similar artists and tracks based on the song and artist
      if (song?.id && song?.artists?.[0]?.id) {
        console.log("Fetching related content for:", song.id, song.artists[0].id);
        const relatedContent = await getRelatedContent(session.user.accessToken, song.id, song.artists[0].id);

        console.log(
          "Related content received:",
          relatedContent?.artists?.length || 0,
          "artists,",
          relatedContent?.tracks?.length || 0,
          "tracks"
        );

        setRelatedArtists(relatedContent?.artists || []);
        setRelatedTracks(relatedContent?.tracks || []);
      }

      // Get user stats for this song
      if (song?.id) {
        const stats = await getUserSongStats(session.user.accessToken, song.id);
        setUserStats(stats);
      }
    } catch (error) {
      console.error("Error fetching related content:", error);
    }
  };

  // Update the refreshAccessToken function
  const refreshAccessToken = async () => {
    try {
      console.log("Attempting to refresh access token...");

      // Use a direct fetch without page navigation
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      // Get the updated token
      const data = await response.json();
      console.log("Token refreshed successfully");

      // Force session update
      await getSession({ force: true });

      return data.accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  // Update the fetchSongOfTheDay function to use a better approach
  const fetchSongOfTheDay = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching song of the day...");
      const song = await getSongOfTheDay(null, session?.user?.id);

      if (!song) {
        console.error("No song returned from getSongOfTheDay");
        setError("Failed to fetch song recommendation. Please try again later.");
        setLoading(false);
        return;
      }

      console.log("Song found:", song.name, "by", song.artists?.[0]?.name);
      setSongOfTheDay(song);

      // Use the extracted helper function
      await fetchRelatedContentAndStats(song);

      setLoading(false);
    } catch (err) {
      console.error("Error fetching song of the day:", err);
      setError("Failed to fetch your song recommendation. Please try again later.");
      setLoading(false);
    }
  }, [session?.user?.id]);

  const revealSong = async () => {
    setRevealed(true);

    if (session?.user?.id && songOfTheDay) {
      try {
        await saveSongToHistory(session.user.id, songOfTheDay);

        if (session?.user?.accessToken && songOfTheDay?.id) {
          // Get related tracks
          const tracks = await getRelatedTracks(songOfTheDay.id, session.user.accessToken);
          setRelatedTracks(tracks);
        }
      } catch (error) {
        console.error("Error in reveal process:", error);
      }
    }
  };

  const submitFeedback = async (feedback) => {
    // Implement the logic to submit feedback to the server
    console.log(`Feedback submitted: ${feedback}`);
  };

  const shareSong = (platform) => {
    if (!songOfTheDay) return;

    console.log("Sharing song:", songOfTheDay);

    if (platform === "twitter") {
      // Create the tweet text with song info and website reference
      const songName = songOfTheDay.name;
      const artistName = songOfTheDay.artists[0].name;
      const songUrl = songOfTheDay.external_urls.spotify;

      const tweetText = `Check out "${songName}" by ${artistName}, my Spotify song of the day! 🎵\n\nListen on Spotify: ${songUrl}\n\nFound via https://spotify-sotd.vercel.app/`;

      // Create the Twitter share URL with encoded text
      const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

      // Open Twitter in a new tab
      window.open(twitterShareUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyLink = () => {
    if (!songOfTheDay) return;

    const shareText = `Check out "${songOfTheDay.name}" by ${songOfTheDay.artists[0].name}, my Spotify song of the day!\n\n🎵 Listen here: ${songOfTheDay.external_urls.spotify}\n\nFound via https://spotify-sotd.vercel.app/`;

    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        setNotification({
          visible: true,
          message: "Link copied to clipboard!",
          type: "success",
        });
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        setNotification({
          visible: true,
          message: "Failed to copy link",
          type: "error",
        });
      });
  };

  // Add this helper function to format Spotify URIs
  const getSpotifyURI = (trackId) => {
    return `spotify:track:${trackId}`;
  };

  // Add this enhanced function to determine the most appropriate link
  const getSpotifyLink = (trackId) => {
    // Native URI (will open app if installed)
    const spotifyURI = `spotify:track:${trackId}`;

    // Web fallback URL
    const webURL = `https://open.spotify.com/track/${trackId}`;

    // For mobile devices, prefer native app URI
    if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return spotifyURI;
    }

    return spotifyURI; // Prefer native app on all platforms
  };

  // Add a useEffect to handle the revealed state
  useEffect(() => {
    console.log("Revealed state changed:", revealed);

    // If the song was revealed but we don't have data, try fetching again
    if (revealed && !songOfTheDay && !loading && !error) {
      console.log("Song was revealed but data is missing, fetching again");
      fetchSongOfTheDay();
    }
  }, [revealed, songOfTheDay, loading, error, fetchSongOfTheDay]);

  // Add these functions if they don't exist
  const getRelatedArtists = async (artistId, accessToken) => {
    try {
      console.log("Fetching artist details for:", artistId);

      // First get the artist's details
      const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!artistResponse.ok) {
        throw new Error("Failed to fetch artist details");
      }

      const artistData = await artistResponse.json();
      console.log("Artist data:", artistData);

      // Get artists from the same genres
      if (artistData.genres?.length > 0) {
        // Get the artist's primary genre
        const mainGenre = artistData.genres[0];

        // Get artists from the same genre, sorted by popularity
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(mainGenre)}"&type=artist&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!searchResponse.ok) {
          throw new Error("Failed to search for similar artists");
        }

        const searchData = await searchResponse.json();

        // Filter out the original artist and get the most popular ones
        const similarArtists = searchData.artists.items
          .filter((artist) => {
            // Filter out the original artist
            if (artist.id === artistId) return false;

            // Check if they share at least one genre with the original artist
            return artist.genres?.some((genre) => artistData.genres.includes(genre));
          })
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 5);

        console.log("Found similar artists:", similarArtists.length);
        return similarArtists;
      }

      return [];
    } catch (error) {
      console.error("Error in getRelatedArtists:", error);
      return [];
    }
  };

  const getRelatedTracks = async (trackId, accessToken) => {
    try {
      console.log("Fetching related tracks with token:", accessToken?.slice(0, 10) + "...");

      // First get the track details to get artist ID
      const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!trackResponse.ok) {
        throw new Error("Failed to fetch track details");
      }

      const trackData = await trackResponse.json();
      const artistId = trackData.artists[0]?.id;

      if (!artistId) {
        throw new Error("No artist ID found");
      }

      // Get artist's top tracks
      const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!topTracksResponse.ok) {
        throw new Error("Failed to fetch artist top tracks");
      }

      const topTracksData = await topTracksResponse.json();

      // Filter out the current track and get up to 5 tracks
      const relatedTracks = topTracksData.tracks.filter((track) => track.id !== trackId).slice(0, 5);

      console.log("Related tracks response:", relatedTracks);
      return relatedTracks;
    } catch (error) {
      console.error("Error fetching related tracks:", error);
      return [];
    }
  };

  // Add this new useEffect to fetch related content when page loads with a revealed song
  useEffect(() => {
    const fetchRelatedContent = async () => {
      if (revealed && songOfTheDay && session?.user?.accessToken) {
        try {
          // Get related tracks
          const tracks = await getRelatedTracks(songOfTheDay.id, session.user.accessToken);
          setRelatedTracks(tracks);
        } catch (error) {
          console.error("Error fetching related content:", error);
        }
      }
    };

    fetchRelatedContent();
  }, [revealed, songOfTheDay, session]);

  if (status === "loading") {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loader}></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Your Song of the Day | Spotify Song of the Day</title>
        <meta
          name="description"
          content="Discover your daily song recommendation based on your Spotify listening history"
        />
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
              <button className={styles.retryButton} onClick={fetchSongOfTheDay}>
                Try Again
              </button>
            </div>
          ) : songOfTheDay ? (
            <div className={styles.songSection}>
              {!revealed ? (
                <div className={`${styles.infoCard} ${styles.revealCard}`}>
                  <div className={styles.revealContainer}>
                    <div className={styles.revealIcon}>
                      <i className="fas fa-gift"></i>
                    </div>
                    <h2>Your Song of the Day is Ready!</h2>
                    <p>We've selected the perfect track just for you today</p>
                    <button className={styles.revealButton} onClick={revealSong}>
                      Reveal Song
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.infoCard}>
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
                          </div>
                        )}
                      </div>

                      <div className={styles.content}>
                        <div className={styles.trackDetails}>
                          <h2 className={styles.title}>{songOfTheDay.name}</h2>
                          <p className={styles.artist}>
                            {songOfTheDay.artists.map((artist) => artist.name).join(", ")}
                          </p>

                          <div className={styles.metaInfo}>
                            <div className={styles.metaItem}>
                              <i className="fas fa-compact-disc"></i>
                              <span>{songOfTheDay.album.name}</span>
                            </div>

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
                            href={getSpotifyLink(songOfTheDay.id)}
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
                  </div>

                  <div className={styles.additionalContent}>
                    <div className={styles.statsSection}>
                      <div className={styles.infoCard}>
                        <div className={styles.userStats}>
                          <h3>Your Listening Stats</h3>
                          <div className={styles.statsList}>
                            {userStats ? (
                              <>
                                <div className={styles.statItem}>
                                  <i className="fas fa-calendar-check"></i>
                                  <span>
                                    Last played:{" "}
                                    {userStats.lastPlayed
                                      ? new Date(userStats.lastPlayed).toLocaleDateString()
                                      : "Never played"}
                                  </span>
                                </div>
                                <div className={styles.statItem}>
                                  <i className="fas fa-play-circle"></i>
                                  <span>Played {userStats.playCount || 0} times in the last 30 days</span>
                                </div>
                                <div className={styles.statItem}>
                                  <i className="fas fa-chart-line"></i>
                                  <span>
                                    {userStats.playCount > 3
                                      ? "You love this track!"
                                      : userStats.playCount > 0
                                      ? "Getting familiar with this one"
                                      : "New discovery for you"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p className={styles.emptyStats}>No listening stats available</p>
                            )}
                          </div>
                        </div>

                        <div className={styles.shareSong}>
                          <h3>Share This Discovery</h3>
                          <div className={styles.shareButtons}>
                            <button className={styles.shareButton} onClick={() => shareSong("twitter")}>
                              <span className={styles.xLogo}>𝕏</span>
                            </button>
                            <button className={styles.copyButton} onClick={handleCopyLink}>
                              <i className="fas fa-link"></i>
                              <span>Copy Link</span>
                            </button>
                          </div>
                        </div>

                        <div className={styles.feedbackSection}>
                          <h3>Help Us Improve Your Recommendations</h3>
                          <div className={styles.feedbackButtons}>
                            <button className={styles.likeButton} onClick={() => submitFeedback("like")}>
                              <i className="fas fa-thumbs-up"></i> Love It
                            </button>
                            <button className={styles.dislikeButton} onClick={() => submitFeedback("dislike")}>
                              <i className="fas fa-thumbs-down"></i> Not For Me
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.tracksSection}>
                      <div className={styles.infoCard}>
                        <div className={styles.relatedSection}>
                          <h3>Similar Tracks</h3>
                          <div className={styles.tracksGrid}>
                            {relatedTracks.length > 0 ? (
                              relatedTracks.map((track) => (
                                <a
                                  key={track.id}
                                  href={track.external_urls?.spotify}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.trackCard}
                                >
                                  {track.album?.images?.[0]?.url && (
                                    <div className={styles.trackImage}>
                                      <Image
                                        src={track.album.images[0].url}
                                        alt={`${track.name} album art`}
                                        width={50}
                                        height={50}
                                      />
                                    </div>
                                  )}
                                  <div className={styles.trackInfo}>
                                    <span className={styles.trackName}>{track.name}</span>
                                    <span className={styles.trackArtist}>
                                      {track.artists.map((a) => a.name).join(", ")}
                                    </span>
                                  </div>
                                </a>
                              ))
                            ) : (
                              <p className={styles.emptyItems}>No similar tracks found</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.noSongContainer}>
              <div className={styles.emptyIcon}>
                <i className="fas fa-headphones"></i>
              </div>
              <h3>No recommendations available</h3>
              <p>
                We couldn't find a song recommendation based on your listening history. Try listening to more music on
                Spotify and check back later!
              </p>
              <button className={styles.retryButton} onClick={() => fetchSongOfTheDay(true)}>
                Refresh Token & Try Again
              </button>
            </div>
          )}
        </div>
      </div>
      <Toast
        visible={notification.visible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </>
  );
}

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
} 
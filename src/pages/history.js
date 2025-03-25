import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getSongHistory } from '../utils/songHistory'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/History.module.css'
import { createPlaylist } from '../utils/spotify'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns'
import Link from 'next/link'

export default function History() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [songHistory, setSongHistory] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
    
    if (session?.user?.id) {
      fetchSongHistory()
    }
  }, [session, status, router, selectedMonth, selectedYear])
  
  const fetchSongHistory = async () => {
    try {
      setLoading(true)
      
      // Get real song history from Supabase
      const history = await getSongHistory(
        session.user.id, 
        selectedMonth, 
        selectedYear
      )
      
      setSongHistory(history)
    } catch (error) {
      console.error('Error fetching song history:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay()
  }
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear)
    const days = []
    
    // Get current date for comparison
    const today = new Date()
    const currentDay = today.getDate()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day)
      const dateKey = date.toISOString().split('T')[0]
      const song = songHistory[dateKey]
      
      // Check if this is the current day
      const isCurrentDay = day === currentDay && 
                           selectedMonth === currentMonth && 
                           selectedYear === currentYear
      
      console.log("Song for day", day, ":", song)
      
      // Check if today's song is unrevealed
      const isUnrevealed = isCurrentDay && !song;
      
      days.push(
        <div key={day} className={`${styles.day} ${isCurrentDay ? styles.currentDay : ''}`}>
          <div className={styles.dayNumber}>{day}</div>
          {song ? (
            <div className={styles.songThumbnail}>
              {isUnrevealed ? (
                // Show clickable present icon for unrevealed song (without text)
                <Link href="/dashboard" className={styles.presentLink}>
                  <div className={styles.presentIcon}>
                    <i className="fas fa-gift"></i>
                  </div>
                </Link>
              ) : (
                // Show regular album art with tooltip
                <>
                  <Image 
                    src={song.album.images[0].url}
                    alt={song.name}
                    width={70}
                    height={70}
                    className={styles.albumCover}
                  />
                  <div className={styles.songTooltip}>
                    <strong>{song.name}</strong>
                    <span>{song.artists.map(a => a.name).join(', ')}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={styles.noSong}>
              <i className="fas fa-music-slash"></i>
            </div>
          )}
        </div>
      )
    }
    
    return days
  }
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const navigateMonth = (direction) => {
    let newMonth = selectedMonth + direction
    let newYear = selectedYear
    
    if (newMonth > 11) {
      newMonth = 0
      newYear++
    } else if (newMonth < 0) {
      newMonth = 11
      newYear--
    }
    
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)
  }
  
  const createMonthlyPlaylist = async () => {
    try {
      setCreatingPlaylist(true);
      
      // Collect all song IDs from the month
      const songIds = Object.values(songHistory)
        .filter(song => song && song.id)
        .map(song => song.id);
      
      if (songIds.length === 0) {
        alert("No songs available to create a playlist");
        return;
      }
      
      // Create the playlist
      const playlistName = `${monthNames[selectedMonth]} ${selectedYear}`;
      const playlistDescription = `Songs discovered through Spotify Song of the Day in ${monthNames[selectedMonth]} ${selectedYear}.`;
      
      // Call the API to create the playlist
      const response = await fetch('/api/createPlaylist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: session.user.accessToken,
          name: playlistName,
          description: playlistDescription,
          songIds: songIds,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.playlistUrl) {
        // Success! Open the playlist in a new tab
        window.open(data.playlistUrl, '_blank');
      } else {
        throw new Error(data.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert(`Failed to create playlist: ${error.message}`);
    } finally {
      setCreatingPlaylist(false);
    }
  };
  
  const prevMonth = () => {
    navigateMonth(-1)
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), 1))
  }
  
  const nextMonth = () => {
    navigateMonth(1)
    setCurrentDate(next => new Date(next.getFullYear(), next.getMonth(), 1))
  }
  
  const handleCreatePlaylist = async () => {
    await createMonthlyPlaylist()
  }
  
  const hasSongsInMonth = Object.keys(songHistory).length > 0
  
  if (status === 'loading') {
    return <div className={styles.loadingScreen}><div className={styles.loader}></div></div>
  }
  
  return (
    <>
      <Head>
        <title>Your Song History | Spotify Song of the Day</title>
        <meta name="description" content="View your past song of the day recommendations" />
      </Head>
      
      <div className={styles.gradientBg}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.heading}>Your Listening History</h1>
            <p className={styles.subheading}>Track your daily song picks and create monthly playlists</p>
          </div>

          <div className={styles.calendarSection}>
            <div className={styles.calendarControls}>
              <div className={styles.monthSelector}>
                <button 
                  className={styles.monthNavButton}
                  onClick={prevMonth}
                  aria-label="Previous month"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <h2 className={styles.monthYear}>
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <button 
                  className={styles.monthNavButton}
                  onClick={nextMonth}
                  aria-label="Next month"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              <button 
                className={styles.createPlaylistButton}
                onClick={handleCreatePlaylist}
                disabled={creatingPlaylist || !hasSongsInMonth}
              >
                {creatingPlaylist ? (
                  <div className={styles.smallLoader}></div>
                ) : (
                  <>
                    <i className="fas fa-plus"></i>
                    Create Monthly Playlist
                  </>
                )}
              </button>
            </div>

            <div className={styles.calendar}>
              <div className={styles.weekdayHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              
              <div className={styles.daysGrid}>
                {loading ? (
                  <div className={styles.calendarLoading}>
                    <div className={styles.loader}></div>
                    <p>Loading your song history...</p>
                  </div>
                ) : (
                  renderCalendar()
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
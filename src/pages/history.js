import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/History.module.css'

export default function History() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [songHistory, setSongHistory] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
    
    if (session?.accessToken) {
      fetchSongHistory()
    }
  }, [session, status, router])
  
  const fetchSongHistory = async () => {
    try {
      setLoading(true)
      
      // This would be replaced with a real API call to get song history
      // For now, we'll use mock data
      const mockHistory = generateMockSongHistory()
      setSongHistory(mockHistory)
    } catch (error) {
      console.error('Error fetching song history:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Mock data generator for demonstration purposes
  const generateMockSongHistory = () => {
    const history = {}
    const today = new Date()
    
    // Generate songs for the last 90 days
    for (let i = 0; i < 90; i++) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      
      // Random album covers and song data
      const albumIdx = Math.floor(Math.random() * 20) + 1
      history[dateKey] = {
        name: `Song ${i+1}`,
        artists: [{ name: `Artist ${Math.floor(Math.random() * 10) + 1}` }],
        album: {
          name: `Album ${Math.floor(Math.random() * 15) + 1}`,
          images: [{ url: `https://picsum.photos/seed/${albumIdx}/300/300` }]
        }
      }
    }
    
    return history
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
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay}></div>)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day)
      const dateKey = date.toISOString().split('T')[0]
      const song = songHistory[dateKey]
      
      days.push(
        <div key={day} className={styles.day}>
          <div className={styles.dayNumber}>{day}</div>
          {song ? (
            <div className={styles.songThumbnail}>
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
      
      // Get all songs from the selected month
      const monthKey = `${selectedYear}-${selectedMonth + 1}`;
      const monthSongs = songHistory[monthKey] || {};
      
      // Filter out days without songs and collect track URIs
      const trackUris = Object.values(monthSongs)
        .filter(song => song && song.id)
        .map(song => `spotify:track:${song.id}`);
      
      if (trackUris.length === 0) {
        alert('No songs available for this month to create a playlist');
        setCreatingPlaylist(false);
        return;
      }
      
      // Create the playlist
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      
      const playlistName = `Songs of ${monthNames[selectedMonth]} ${selectedYear}`;
      const description = `My daily song recommendations from ${monthNames[selectedMonth]} ${selectedYear}`;
      
      const response = await fetch('/api/createPlaylist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playlistName,
          description: description,
          trackUris: trackUris,
          accessToken: session.accessToken,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.playlistUrl) {
        // Redirect to the Spotify playlist
        window.open(data.playlistUrl, '_blank');
      } else {
        throw new Error(data.error || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create the playlist. Please try again.');
    } finally {
      setCreatingPlaylist(false);
    }
  };
  
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
          <header className={styles.header}>
            <h1 className={styles.heading}>Your Song History</h1>
            <p className={styles.subheading}>A calendar view of your personalized daily tracks</p>
          </header>
          
          <div className={styles.calendarControls}>
            <button 
              className={styles.monthNavButton}
              onClick={() => navigateMonth(-1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            
            <h2 className={styles.monthYear}>
              {monthNames[selectedMonth]} {selectedYear}
            </h2>
            
            <button 
              className={styles.monthNavButton}
              onClick={() => navigateMonth(1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            
            <button 
              className={styles.createPlaylistButton}
              onClick={createMonthlyPlaylist}
              disabled={creatingPlaylist}
            >
              {creatingPlaylist ? (
                <>
                  <div className={styles.smallLoader}></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-music"></i>
                  <span>Create Spotify Playlist</span>
                </>
              )}
            </button>
          </div>
          
          <div className={styles.calendar}>
            <div className={styles.weekdayHeader}>
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
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
    </>
  )
} 
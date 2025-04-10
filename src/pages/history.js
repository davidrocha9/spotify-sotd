import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getSongHistory } from '../utils/songHistory'
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
    // Redirect unauthenticated users, but don't do this during the loading state
    if (status === 'unauthenticated') {
      router.push('/')
    }
    
    // Only fetch song history when we have a confirmed authenticated session
    if (status === 'authenticated' && session?.user?.id) {
      fetchSongHistory()
    }
  }, [session, status, router, selectedMonth, selectedYear])
  
  const fetchSongHistory = async () => {
    console.log("Fetching song history for user:", session.user.id);
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
      // FIX: Create a date string in YYYY-MM-DD format that doesn't depend on timezone
      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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
  
  if (status === 'loading' || status === 'unauthenticated') {
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
            <div className={styles.monthSelector}>
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
            </div>
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
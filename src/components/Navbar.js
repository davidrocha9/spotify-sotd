import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import styles from '../styles/Navbar.module.css'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Handle window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    // Check initially
    checkIfMobile()
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(`.${styles.mobileMenu}`) && 
          !event.target.closest(`.${styles.hamburger}`)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <i className="fa-brands fa-spotify" style={{ fontSize: '24px', color: '#1DB954' }}></i>
          <span>Song of the Day</span>
        </Link>
        
        {session && (
          <>
            {isMobile ? (
              <>
                <div className={styles.mobileProfileSection}>
                  {session.user?.image ? (
                    <Image 
                      src={session.user.image}
                      alt="Profile"
                      width={36}
                      height={36}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.profileIcon}>
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                </div>

                <button 
                  className={`${styles.hamburger} ${isMenuOpen ? styles.active : ''}`}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="Toggle menu"
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>

                <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
                  <div className={styles.mobileNavLinks}>
                    <Link 
                      href="/dashboard" 
                      className={styles.mobileNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="fas fa-music"></i>
                      Today's Song
                    </Link>
                    <Link 
                      href="/rankings" 
                      className={styles.mobileNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="fas fa-trophy"></i>
                      Rankings
                    </Link>
                    <Link 
                      href="/history" 
                      className={styles.mobileNavLink}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="fas fa-history"></i>
                      History
                    </Link>
                  </div>

                  <button 
                    onClick={() => {
                      setIsMenuOpen(false)
                      signOut()
                    }} 
                    className={styles.mobileSignOutButton}
                  >
                    <i className="fas fa-door-open"></i>
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.navLinks}>
                  <Link href="/dashboard" className={styles.navLink}>
                    Today's Song
                  </Link>
                  <Link href="/rankings" className={styles.navLink}>
                    <i className="fas fa-trophy"></i> Rankings
                  </Link>
                  <Link href="/history" className={styles.navLink}>
                    <i className="fas fa-history"></i> History
                  </Link>
                </div>
                
                <div className={styles.userSection}>
                  {session.user?.image ? (
                    <div className={styles.profileContainer}>
                      <Image 
                        src={session.user.image}
                        alt="Profile"
                        width={36}
                        height={36}
                        className={styles.avatar}
                      />
                      <span className={styles.username}>{session.user.name?.split(' ')[0]}</span>
                    </div>
                  ) : (
                    <div className={styles.profileIcon}>
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                  <button onClick={() => signOut()} className={styles.signOutButton}>
                    <i className="fas fa-door-open"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  )
} 
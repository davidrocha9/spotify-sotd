import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import styles from '../styles/Navbar.module.css'
import { useState } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <i className="fab fa-spotify"></i>
          <span>Song of the Day</span>
        </Link>

        {session && (
          <>
            {/* Desktop Navigation */}
            <div className={styles.desktopNav}>
              <div className={styles.links}>
                <Link href="/dashboard">Today's Song</Link>
                <Link href="/playlists">Monthly Playlists</Link>
                <Link href="/rankings">Rankings</Link>
                <Link href="/history">History</Link>
              </div>

              <div className={styles.profile}>
                {session.user?.image ? (
                  <Image src={session.user.image} alt="Profile" width={32} height={32} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>{session.user?.name?.[0] || "U"}</div>
                )}
                <button onClick={() => signOut()} className={styles.signOutButton}>
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className={styles.mobileNav}>
              <button className={styles.menuButton} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
              </button>

              {isMenuOpen && (
                <div className={styles.mobileMenu}>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <i className="fas fa-music"></i> Today's Song
                  </Link>
                  <Link href="/rankings" onClick={() => setIsMenuOpen(false)}>
                    <i className="fas fa-trophy"></i> Rankings
                  </Link>
                  <Link href="/history" onClick={() => setIsMenuOpen(false)}>
                    <i className="fas fa-history"></i> History
                  </Link>
                  <button onClick={() => signOut()} className={styles.mobileSignOut}>
                    <i className="fas fa-sign-out-alt"></i> Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
} 
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import styles from '../styles/Navbar.module.css'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <i className="fa-brands fa-spotify" style={{ fontSize: '24px', color: '#1DB954' }}></i>
          <span>Song of the Day</span>
        </Link>
        
        {session && (
          <>
            <div className={styles.navLinks}>
              <Link href="/dashboard" className={styles.navLink}>
                Today's Song
              </Link>
              <Link href="/history" className={styles.navLink}>
                <i className="fas fa-history"></i> Song History
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
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  )
} 
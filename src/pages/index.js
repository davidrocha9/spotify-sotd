import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // If logged in, redirect to dashboard
  if (status === 'authenticated') {
    router.push('/dashboard')
    return null
  }

  return (
    <>
      <Head>
        <title>Spotify Song of the Day</title>
        <meta name="description" content="Discover your daily song recommendation based on your Spotify listening history" />
        <link rel="icon" href="https://www.spotify.com/favicon.ico" />
      </Head>

      <div className={styles.hero}>
        <div className={styles.gradientOrb}></div>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Discover your <span>perfect</span> daily track
          </h1>
          
          <p className={styles.description}>
            Get a personalized song recommendation every day, intelligently curated based on your Spotify listening patterns.
          </p>
          
          <button 
            className={styles.loginButton}
            onClick={() => signIn('spotify')}
          >
            <i className="fab fa-spotify"></i>
            <span>Continue with Spotify</span>
          </button>
        </div>
        
        <div className={styles.visual}>
          <div className={styles.musicControls}>
            <div className={styles.albumCover}>
              <i className="fas fa-music"></i>
            </div>
            <div className={styles.playerControls}>
              <div className={styles.trackInfo}>
                <span className={styles.trackName}>Your Song of the Day</span>
                <span className={styles.artistName}>Personalized for You</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progress}></div>
              </div>
              <div className={styles.controls}>
                <i className="fas fa-step-backward"></i>
                <i className="fas fa-play-circle fa-2x"></i>
                <i className="fas fa-step-forward"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <i className="fas fa-fingerprint"></i>
          </div>
          <h3>Personalized</h3>
          <p>Uses your actual listening behavior to find songs that match your taste precisely.</p>
        </div>
        
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <i className="fas fa-calendar-day"></i>
          </div>
          <h3>Daily Discovery</h3>
          <p>Fresh recommendations daily that evolve with your changing music preferences.</p>
        </div>
        
        <div className={styles.feature}>
          <div className={styles.featureIcon}>
            <i className="fas fa-bolt"></i>
          </div>
          <h3>Instant Setup</h3>
          <p>One-click login with your Spotify account. No complicated setup required.</p>
        </div>
      </div>
    </>
  )
} 
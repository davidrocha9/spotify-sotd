import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useState, useEffect } from 'react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Define albums array outside the component or memoize it
  const famousAlbums = [
    { 
      url: "https://i.scdn.co/image/ab67616d0000b27349d694203245f241a1bcaa72", 
      name: "Andrea", 
      artist: "Bad Bunny, Buscabulla" 
    },
    { 
      url: "https://i.scdn.co/image/ab67616d0000b273cdb645498cd3d8a2db4d05e1", 
      name: "To Pimp a Butterfly", 
      artist: "Kendrick Lamar" 
    },
    { 
      url: "https://i.scdn.co/image/ab67616d0000b273aacc3ddf3bfa01f4bd44cacc", 
      name: "Show Me", 
      artist: "Joey Bada$$" 
    },
    { 
      url: "https://i.scdn.co/image/ab67616d0000b27325b055377757b3cdd6f26b78", 
      name: "All Falls Down", 
      artist: "Kanye West, Syleena Johnson" 
    },
    { 
      url: "https://i.scdn.co/image/ab67616d0000b273124e9249fada4ff3c3a0739c", 
      name: "Like Him (feat. Lola Young)", 
      artist: "Tyler, The Creator, Lola Young" 
    }
  ];

  // ALWAYS declare all hooks, regardless of conditions
  const [currentAlbum, setCurrentAlbum] = useState(famousAlbums[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle album rotation effect
  useEffect(() => {
    // Skip the effect if user is authenticated
    if (status === 'authenticated') return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        const nextIndex = (famousAlbums.findIndex(album => 
          album.name === currentAlbum.name) + 1) % famousAlbums.length;
        
        setCurrentAlbum(famousAlbums[nextIndex]);
        
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 800);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [currentAlbum, status]);
  
  // Handle redirect after hooks have been called
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.accessToken) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // User is authenticated, but we've already called all hooks
  if (status === 'authenticated') {
    return null; // Safe to return null now since all hooks have been called
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
            <div className={`${styles.albumCover} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
              <Image 
                src={currentAlbum.url}
                alt={`${currentAlbum.name} by ${currentAlbum.artist}`}
                width={550}
                height={550}
                className={styles.albumImage}
              />
            </div>
            
            <div className={`${styles.playerControls} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
              <div className={styles.trackInfo}>
                <span className={styles.trackName}>{currentAlbum.name}</span>
                <span className={styles.artistName}>{currentAlbum.artist}</span>
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
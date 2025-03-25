import styles from '../styles/Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.credits}>
          <p>Made with <span className={styles.heart}>❤️</span> by David Rocha</p>
          <div className={styles.socials}>
            <a 
              href="https://www.linkedin.com/in/davidsoutorocha/" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <i className="fab fa-linkedin"></i>
            </a>
            <a 
              href="https://github.com/davidrocha9" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <i className="fab fa-github"></i>
            </a>
            <a 
              href="https://davidrocha9.github.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Portfolio"
            >
              <i className="fas fa-globe"></i>
            </a>
          </div>
        </div>
        <p className={styles.powered}>
          <i className="fab fa-spotify"></i>
          <span>Powered by Spotify API</span>
        </p>
      </div>
    </footer>
  )
} 
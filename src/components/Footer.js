import styles from '../styles/Footer.module.css'

export default function Footer() {
  const year = new Date().getFullYear()
  
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <p><i className="far fa-copyright" style={{ marginRight: "0.25rem" }}></i> {year} Spotify Song of the Day</p>
        <p><i className="fab fa-spotify" style={{ marginRight: "0.25rem" }}></i> Powered by the Spotify API</p>
      </div>
    </footer>
  )
} 
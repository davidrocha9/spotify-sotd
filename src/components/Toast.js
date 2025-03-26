import { useEffect } from "react";
import styles from "../styles/Toast.module.css";

export default function Toast({ message, type = "success", visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span>{message}</span>
      <button className={styles.closeButton} onClick={onClose}>
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
}

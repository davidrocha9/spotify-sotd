import { useState, useEffect } from 'react';

export function useAlbumRotation(albums, isAuthenticated) {
  const [currentAlbum, setCurrentAlbum] = useState(albums[0]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        const nextIndex = (albums.findIndex(album => 
          album.name === currentAlbum.name) + 1) % albums.length;
        
        setCurrentAlbum(albums[nextIndex]);
        
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 800);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [currentAlbum, isAuthenticated, albums]);

  return { currentAlbum, isTransitioning };
} 
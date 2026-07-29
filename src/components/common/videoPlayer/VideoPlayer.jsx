import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './VideoPlayer.module.css';
import CustomControls from './CustomControls';

const VideoPlayer = ({ media, onClose }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [subtitles, setSubtitles] = useState([]);
  const playerContainerRef = useRef(null);

  const baseUrl = `${process.env.REACT_APP_BACKEND_URL}/api/video-player`;
  const storageKey = `resume_${media.aliasRoute}_${media.folder}_${media.title}`;



  // Auto-ocultar controles
  const handleActivity = useCallback(() => {
    setShowUI(true);
    if (window.hideTimer) clearTimeout(window.hideTimer);
    window.hideTimer = setTimeout(() => setShowUI(false), 3000);
  }, []);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const response = await fetch(`${baseUrl}/subs-list/${media.aliasRoute}/${media.folder}/${media.title}`);
        const json = await response.json();
        if (json.status === 'success') setSubtitles(json.data);
      } catch (err) {
        console.error("Error cargando subtítulos", err);
      }
    };
    fetchSubs();
  }, [media, baseUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const v = videoRef.current;
      if (!v) return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') v.currentTime += 10;
      if (e.key === 'ArrowLeft') v.currentTime -= 10;
      if (e.key === 'f') v.requestFullscreen?.();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime) videoRef.current.currentTime = parseFloat(savedTime);
  };

  return (
    <div
    ref={playerContainerRef}
      className={`${styles.overlay} ${!showUI ? styles.hideCursor : ''}`}
      onMouseMove={handleActivity}
      onClick={handleActivity}
    >
      <button className={`${styles.closeBtn} ${showUI ? styles.show : ''}`} onClick={onClose}>✕</button>

      <div className={styles.videoWrapper} onClick={togglePlay}>
        <video
          ref={videoRef}
          autoPlay
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => {
            if (Math.floor(videoRef.current.currentTime) % 5 === 0) {
              localStorage.setItem(storageKey, videoRef.current.currentTime);
            }
          }}
          crossOrigin="anonymous"
          className={styles.videoElement}
        >
          <source src={`${baseUrl}/${media.aliasRoute}/${media.folder}/${media.title}`} type="video/mp4" />
          {/* IMPORTANTE: Estos tracks deben estar aquí para que el navegador los detecte */}
          {subtitles.map((track, index) => (
            <track
              key={index}
              kind="subtitles"
              label={track.tags?.language?.toUpperCase() || `Pista ${index + 1}`}
              src={`${baseUrl}/subs-file/${media.aliasRoute}/${media.folder}/${media.title}/${track.index}`}
              srcLang={track.tags?.language || 'es'}
              // Por defecto todos desactivados
              default={false}
            />
          ))}
        </video>
      </div>

      <CustomControls
        videoRef={videoRef}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        visible={showUI}
        title={media.title}
        subtitles={subtitles}
        playerContainerRef={playerContainerRef}
      />
    </div>
  );
};

export default VideoPlayer;
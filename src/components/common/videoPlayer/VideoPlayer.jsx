import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './VideoPlayer.module.css';
import CustomControls from './CustomControls';
import { NextEpisodeOverlay } from './NextEpisodeOverlay.jsx';

const VideoPlayer = ({
  media,
  nextEpisode = null,
  onClose,
  onPlayNextEpisode,
  endingOffsetSeconds = 45
}) => {
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [subtitles, setSubtitles] = useState([]);
  const [audioFallback, setAudioFallback] = useState(false);
  const [showNextOverlay, setShowNextOverlay] = useState(false);

  const hideTimerRef = useRef(null);
  const hasDismissedNextRef = useRef(false);

  const baseUrl = `${process.env.REACT_APP_BACKEND_URL}/api/video-player`;
  const currentMediaKey = `${media.aliasRoute}_${media.folder}_${media.title}`;
  const storageKey = `resume_${currentMediaKey}`;

  const videoSrc = audioFallback
    ? `${baseUrl}/audio-fix/${media.aliasRoute}/${media.folder}/${media.title}`
    : `${baseUrl}/${media.aliasRoute}/${media.folder}/${media.title}`;

  // RESET TOTAL cada vez que cambia el objeto `media` (Nuevo episodio)
  useEffect(() => {
    setShowNextOverlay(false);
    hasDismissedNextRef.current = false;
    setIsPlaying(true);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.load(); // Forzar recarga del buffer multimedia
    }
  }, [currentMediaKey]);

  // Ocultar la UI tras 3 segundos de inactividad
  const handleActivity = useCallback(() => {
    setShowUI(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowUI(false), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchSubs = async () => {
      try {
        const response = await fetch(`${baseUrl}/subs-list/${media.aliasRoute}/${media.folder}/${media.title}`);
        const json = await response.json();
        if (isMounted && json.status === 'success') {
          setSubtitles(json.data || []);
        }
      } catch (err) {
        console.error("Error cargando subtítulos", err);
      }
    };

    fetchSubs();
    return () => { isMounted = false; };
  }, [currentMediaKey, baseUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleError = () => {
      if (!audioFallback) setAudioFallback(true);
    };

    video.addEventListener('error', handleError);
    return () => video.removeEventListener('error', handleError);
  }, [audioFallback, currentMediaKey]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const v = videoRef.current;
      if (!v) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        v.currentTime = Math.min(v.duration || 0, v.currentTime + 10);
      } else if (e.key === 'ArrowLeft') {
        v.currentTime = Math.max(0, v.currentTime - 10);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          playerContainerRef.current?.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, togglePlay]);

  const handleLoadedMetadata = () => {
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime && videoRef.current) {
      videoRef.current.currentTime = parseFloat(savedTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;

    if (Math.floor(v.currentTime) % 5 === 0 && v.currentTime > 0) {
      localStorage.setItem(storageKey, v.currentTime.toString());
    }

    if (nextEpisode && !showNextOverlay && !hasDismissedNextRef.current && v.duration > 0) {
      const timeRemaining = v.duration - v.currentTime;
      if (timeRemaining <= endingOffsetSeconds && timeRemaining > 0) {
        setShowNextOverlay(true);
      }
    }
  };

  const triggerNextEpisode = useCallback((targetEpisode) => {
    if (!targetEpisode || !onPlayNextEpisode) return;

    const nextStorageKey = `resume_${targetEpisode.aliasRoute}_${targetEpisode.folder}_${targetEpisode.title}`;
    localStorage.removeItem(nextStorageKey);
    localStorage.removeItem(storageKey);

    setShowNextOverlay(false);
    hasDismissedNextRef.current = false;

    onPlayNextEpisode(targetEpisode);
  }, [onPlayNextEpisode, storageKey]);

  const handleVideoEnded = () => {
    setIsPlaying(false);
    localStorage.removeItem(storageKey);

    if (nextEpisode && !hasDismissedNextRef.current) {
      triggerNextEpisode(nextEpisode);
    }
  };

  return (
    <div
      ref={playerContainerRef}
      className={`${styles.overlay} ${!showUI ? styles.hideCursor : ''}`}
      onMouseMove={handleActivity}
      onClick={handleActivity}
    >
      <button 
        className={`${styles.closeBtn} ${showUI ? styles.show : ''}`} 
        onClick={onClose}
        aria-label="Cerrar reproductor"
      >
        ✕
      </button>

      <div className={`${styles.topHeaderRight} ${showUI ? styles.show : ''}`}>
        <h3 className={styles.mediaTitle}>{media.title}</h3>
        {media.folder && <span className={styles.mediaFolder}>{media.folder}</span>}
      </div>

      <div className={styles.videoWrapper} onClick={togglePlay}>
        <video
          key={videoSrc} // Fuerza a HTML a reconstruir el tag de video cuando cambia la URL
          ref={videoRef}
          autoPlay
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          crossOrigin="anonymous"
          className={styles.videoElement}
        >
          <source src={videoSrc} />
        </video>
      </div>

      <CustomControls
        key={currentMediaKey} // Clave fundamental para reiniciar CustomControls y sus estados internos de tiempo (00:00)
        videoRef={videoRef}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        visible={showUI}
        subtitles={subtitles}
        baseUrl={baseUrl}
        media={media}
        playerContainerRef={playerContainerRef}
      />

      {showNextOverlay && nextEpisode && (
        <NextEpisodeOverlay
          key={`overlay_${nextEpisode.title}`}
          nextEpisode={nextEpisode}
          onPlayNext={() => triggerNextEpisode(nextEpisode)}
          onCancel={() => {
            setShowNextOverlay(false);
            hasDismissedNextRef.current = true;
          }}
          countdownSeconds={10}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
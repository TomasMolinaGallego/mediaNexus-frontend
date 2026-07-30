import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './VideoPlayer.module.css';
import CustomControls from './CustomControls';

const VideoPlayer = ({ media, onClose }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [subtitles, setSubtitles] = useState([]);
  const [duration, setDuration] = useState(0);
  const [needsTransmuxing, setNeedsTransmuxing] = useState(false);
  const [seekOffset, setSeekOffset] = useState(0);
  const playerContainerRef = useRef(null);

  const baseUrl = `${process.env.REACT_APP_BACKEND_URL}/api/video-player`;
  const storageKey = `resume_${media.aliasRoute}_${media.folder}_${media.title}`;

  // Control de visibilidad de interfaz
  const handleActivity = useCallback(() => {
    setShowUI(true);
    if (window.hideTimer) clearTimeout(window.hideTimer);
    window.hideTimer = setTimeout(() => setShowUI(false), 3000);
  }, []);

  // Carga de metadatos (duración, lista de subtítulos y modo de transmuxing)
  useEffect(() => {
    const fetchMediaInfo = async () => {
      try {
        const response = await fetch(`${baseUrl}/info/${media.aliasRoute}/${media.folder}/${media.title}`);
        const json = await response.json();
        if (json.status === 'success') {
          setSubtitles(json.data.subtitles || []);
          setDuration(json.data.duration || 0);
          setNeedsTransmuxing(json.data.needsTransmuxing || false);
        }
      } catch (err) {
        console.error("Error cargando metadatos del video:", err);
      }
    };
    fetchMediaInfo();
  }, [media, baseUrl]);

  /**
   * Manejador central de saltos de tiempo (Seeking)
   */
  const handleSeek = useCallback((targetTimeSeconds) => {
    const video = videoRef.current;
    if (!video) return;

    const safeTarget = Math.max(0, Math.min(targetTimeSeconds, duration || targetTimeSeconds));

    if (needsTransmuxing) {
      // En transmuxing: Cambiamos el 'src' pidiéndole a FFmpeg que inicie desde targetTimeSeconds (-ss)
      setSeekOffset(safeTarget);
      video.pause();
      video.src = `${baseUrl}/${media.aliasRoute}/${media.folder}/${media.title}?start=${Math.floor(safeTarget)}`;
      video.load();
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      // En reproductor nativo: Salto tradicional
      video.currentTime = safeTarget;
    }
  }, [baseUrl, media, duration, needsTransmuxing]);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const v = videoRef.current;
      if (!v) return;

      const currentAbsoluteTime = needsTransmuxing ? seekOffset + v.currentTime : v.currentTime;

      if (e.key === ' ') { 
        e.preventDefault(); 
        togglePlay(); 
      }
      if (e.key === 'ArrowRight') {
        handleSeek(currentAbsoluteTime + 10);
      }
      if (e.key === 'ArrowLeft') {
        handleSeek(currentAbsoluteTime - 10);
      }
      if (e.key === 'f') {
        if (!document.fullscreenElement) {
          playerContainerRef.current?.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleSeek, needsTransmuxing, seekOffset]);

  const togglePlay = () => {
    if (!videoRef.current) return;
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
    if (savedTime && videoRef.current && seekOffset === 0) {
      const target = parseFloat(savedTime);
      if (target > 0) {
        handleSeek(target);
      }
    }
  };

  const currentStreamUrl = `${baseUrl}/${media.aliasRoute}/${media.folder}/${media.title}` + 
    (seekOffset > 0 ? `?start=${Math.floor(seekOffset)}` : '');

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
          src={currentStreamUrl}
          autoPlay
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => {
            if (videoRef.current) {
              const currentAbsoluteTime = seekOffset + videoRef.current.currentTime;
              if (Math.floor(currentAbsoluteTime) % 5 === 0) {
                localStorage.setItem(storageKey, currentAbsoluteTime.toString());
              }
            }
          }}
          crossOrigin="anonymous"
          className={styles.videoElement}
        >
          {subtitles.map((track) => (
            <track
              key={track.index}
              kind="subtitles"
              label={track.title || track.language?.toUpperCase() || `Pista ${track.index}`}
              src={`${baseUrl}/subs-file/${media.aliasRoute}/${media.folder}/${media.title}/${track.index}`}
              srcLang={track.language || 'es'}
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
        duration={duration}
        seekOffset={seekOffset}
        onSeek={handleSeek}
        playerContainerRef={playerContainerRef}
      />
    </div>
  );
};

export default VideoPlayer;
import React, { useEffect, useState, useRef, useCallback } from 'react';
import styles from './VideoPlayer.module.css';
import CustomControls from './CustomControls';

const VideoPlayer = ({ media, onClose }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [subtitles, setSubtitles] = useState([]);
  const [audioFallback, setAudioFallback] = useState(false);
  const [ready, setReady] = useState(false); // espera al media-info antes de montar el <video>
  const playerContainerRef = useRef(null);

  const baseUrl = `${process.env.REACT_APP_BACKEND_URL}/api/video-player`;
  const storageKey = `resume_${media.aliasRoute}_${media.folder}_${media.title}`;

  const videoSrc = audioFallback
    ? `${baseUrl}/audio-fix/${media.aliasRoute}/${media.folder}/${media.title}`
    : `${baseUrl}/${media.aliasRoute}/${media.folder}/${media.title}`;

  const handleActivity = useCallback(() => {
    setShowUI(true);
    if (window.hideTimer) clearTimeout(window.hideTimer);
    window.hideTimer = setTimeout(() => setShowUI(false), 3000);
  }, []);

  // Decide de antemano si hace falta el audio-fix, consultando el códec real
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    const fetchMediaInfo = async () => {
      try {
        const response = await fetch(`${baseUrl}/media-info/${media.aliasRoute}/${media.folder}/${media.title}`);
        const json = await response.json();
        if (!cancelled) {
          setAudioFallback(json.status === 'success' && json.data.needsAudioFix);
          setReady(true);
        }
      } catch (err) {
        console.error("Error consultando media-info", err);
        if (!cancelled) setReady(true); // seguimos con la fuente directa por defecto
      }
    };
    fetchMediaInfo();
    return () => { cancelled = true; };
  }, [media, baseUrl]);

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

  // Red de seguridad: si el códec "parecía seguro" pero el navegador decodifica
  // vídeo y no decodifica ningún byte de audio, activamos el fallback igualmente.
  useEffect(() => {
    if (!ready || audioFallback) return;
    const video = videoRef.current;
    if (!video) return;

    const handleErrorEvent = () => setAudioFallback(true);
    video.addEventListener('error', handleErrorEvent);

    let checkTimer = null;
    const handlePlaying = () => {
      checkTimer = setTimeout(() => {
        const decoded = video.webkitAudioDecodedByteCount; // Chrome/Edge
        const hasAudioTrack = video.audioTracks ? video.audioTracks.length > 0 : true;
        if (hasAudioTrack && typeof decoded === 'number' && decoded === 0) {
          setAudioFallback(true);
        }
      }, 4000);
    };
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('error', handleErrorEvent);
      video.removeEventListener('playing', handlePlaying);
      if (checkTimer) clearTimeout(checkTimer);
    };
  }, [ready, audioFallback, videoSrc]);

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

      {ready && (
        <div className={styles.videoWrapper} onClick={togglePlay}>
          <video
            key={videoSrc}
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
            <source src={videoSrc} />
          </video>
        </div>
      )}

      <CustomControls
        videoRef={videoRef}
        isPlaying={isPlaying}
        togglePlay={togglePlay}
        visible={showUI}
        title={media.title}
        subtitles={subtitles}
        baseUrl={baseUrl}
        media={media}
        playerContainerRef={playerContainerRef}
      />
    </div>
  );
};

export default VideoPlayer;
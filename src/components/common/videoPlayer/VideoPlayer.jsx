import React, { useEffect, useState, useRef } from 'react';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({ media, onClose }) => {
  const [subtitles, setSubtitles] = useState([]);
  const videoRef = useRef(null);
  const baseUrl = `${process.env.REACT_APP_BACKEND_URL}/api/video-player`;
  const [initialTimeSet, setInitialTimeSet] = useState(false);

  const storageKey = `resume_${media.aliasRoute}_${media.folder}_${media.title}`;

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

  const handleLoadedMetadata = () => {
    const savedTime = localStorage.getItem(storageKey);
    if (savedTime && videoRef.current) {
      const time = parseFloat(savedTime);
      if (time < videoRef.current.duration * 0.95) {
        videoRef.current.currentTime = time;
      }
    }
    setInitialTimeSet(true);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !initialTimeSet) return;

    const currentTime = videoRef.current.currentTime;
    if (Math.floor(currentTime) % 2 === 0) {
      localStorage.setItem(storageKey, currentTime.toString());
    }

    if (currentTime > videoRef.current.duration * 0.98) {
      localStorage.removeItem(storageKey);
    }
  };

  const videoSrc = `${baseUrl}/${media.aliasRoute}/${media.folder}/${media.title}`;

  return (
    <div className={styles.overlay}>
      <button className={styles.closeBtn} onClick={onClose}>✕ Cerrar</button>
      <div className={styles.playerWrapper}>
        <video
          ref={videoRef}
          controls
          autoPlay
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          crossOrigin="anonymous"
          className={styles.videoElement}
        >
          <source src={videoSrc} type="video/x-matroska" />
          <source src={videoSrc} type="video/mp4" />

          {subtitles.map((track) => (
            <track
              key={track.index}
              kind="subtitles"
              label={track.tags.language || track.tags.title || `Pista ${track.index}`}
              src={`${baseUrl}/subs-file/${media.aliasRoute}/${media.folder}/${media.title}/${track.index}`}
              srcLang={track.tags.language || 'es'}
            />
          ))}
        </video>
      </div>
    </div>
  );
};

export default VideoPlayer;
import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoPlayer.module.css';
import { FiPlay, FiPause, FiMaximize, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { MdSubtitles } from 'react-icons/md';

const CustomControls = ({
  videoRef,
  isPlaying,
  togglePlay,
  visible,
  subtitles,
  playerContainerRef,
  baseUrl,
  media
}) => {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [activeSubIndex, setActiveSubIndex] = useState(null);
  const [timers, setTimers] = useState({ current: '00:00', total: '00:00' });
  
  const progressBarRef = useRef(null);
  const trackElRef = useRef(null);
  const objectUrlRef = useRef(null);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanupTrack = () => {
    if (trackElRef.current) {
      trackElRef.current.remove();
      trackElRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupTrack();
  }, []);

  const selectSubtitle = async (streamIndex) => {
    cleanupTrack();
    setActiveSubIndex(streamIndex);
    setShowSubMenu(false);

    if (streamIndex === -1 || !videoRef.current) return;

    try {
      const subUrl = `${baseUrl}/subs-file/${media.aliasRoute}/${media.folder}/${media.title}/${streamIndex}`;
      const response = await fetch(subUrl);
      const blob = await response.blob();
      
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.src = objectUrl;
      track.default = true;

      track.onload = () => {
        const tracks = videoRef.current?.textTracks;
        if (tracks && tracks.length > 0) {
          for (let i = 0; i < tracks.length; i++) {
            tracks[i].mode = 'disabled';
          }
          tracks[tracks.length - 1].mode = 'showing';
        }
      };

      videoRef.current.appendChild(track);
      trackElRef.current = track;
    } catch (err) {
      console.error("Error al cargar la pista de subtítulos", err);
    }
  };

  // Selección automática del primer subtítulo de la lista al cargar
  useEffect(() => {
    if (subtitles && subtitles.length > 0 && activeSubIndex === null) {
      selectSubtitle(subtitles[0].index);
    }
  }, [subtitles]);

  // Actualización de progreso y tiempos
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      const dur = video.duration || 0;
      const cur = video.currentTime || 0;
      setProgress(dur > 0 ? (cur / dur) * 100 : 0);
      setTimers({ current: formatTime(cur), total: formatTime(dur) });
    };

    video.addEventListener('timeupdate', update);
    video.addEventListener('loadedmetadata', update);
    return () => {
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('loadedmetadata', update);
    };
  }, [videoRef]);

  const handleSeek = (e) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * (videoRef.current.duration || 0);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuteState = !isMuted;
    videoRef.current.muted = newMuteState;
    setIsMuted(newMuteState);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className={`${styles.controlsContainer} ${visible ? styles.show : ''}`}>
      {/* Barra de Progreso */}
      <div className={styles.progressArea} ref={progressBarRef} onClick={handleSeek}>
        <div className={styles.progressBase}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          <div className={styles.progressKnob} style={{ left: `${progress}%` }} />
        </div>
      </div>

      {/* Botones de Control */}
      <div className={styles.buttonsRow}>
        <div className={styles.leftBtns}>
          <button onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>

          <div className={styles.timeDisplay}>
            <span>{timers.current}</span>
            <span> / </span>
            <span>{timers.total}</span>
          </div>

          <div className={styles.volumeWrapper}>
            <button onClick={toggleMute} aria-label="Volumen">
              {isMuted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className={styles.volumeSlider}
              aria-label="Control de volumen"
            />
          </div>
        </div>

        <div className={styles.rightBtns}>
          {/* Selector de Subtítulos */}
          <div className={styles.subtitleWrapper}>
            {showSubMenu && (
              <ul className={styles.subtitleMenu}>
                <li onClick={() => selectSubtitle(-1)}>Desactivar</li>
                {subtitles.map((s) => (
                  <li key={s.index} onClick={() => selectSubtitle(s.index)}>
                    {s.tags?.language?.toUpperCase() || `Pista ${s.index}`}
                    {activeSubIndex === s.index ? ' ✓' : ''}
                  </li>
                ))}
              </ul>
            )}
            <button 
              onClick={() => setShowSubMenu(!showSubMenu)} 
              aria-label="Subtítulos"
            >
              <MdSubtitles />
            </button>
          </div>

          <button onClick={toggleFullscreen} aria-label="Pantalla completa">
            <FiMaximize />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomControls;
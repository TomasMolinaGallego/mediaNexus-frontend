import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoPlayer.module.css';
import { FiPlay, FiPause, FiMaximize, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { MdSubtitles } from 'react-icons/md';

const CustomControls = ({ 
  videoRef, 
  isPlaying, 
  togglePlay, 
  visible, 
  title, 
  subtitles = [], 
  duration = 0,
  seekOffset = 0,
  onSeek,
  playerContainerRef 
}) => {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [timers, setTimers] = useState({ current: '00:00', total: '00:00' });
  const progressBarRef = useRef(null);

  /**
   * Obtiene la duración total válida del video.
   */
  const getEffectiveDuration = () => {
    const video = videoRef.current;
    if (video && isFinite(video.duration) && video.duration > 0 && seekOffset === 0) {
      return video.duration;
    }
    return duration || 0;
  };

  /**
   * Formatea los segundos a "mm:ss" o "hh:mm:ss"
   */
  const formatTime = (time) => {
    if (!time || isNaN(time) || !isFinite(time)) return '00:00';
    const hrs = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const effDuration = getEffectiveDuration();
      const currentAbsoluteTime = seekOffset + (video.currentTime || 0);
      const currentProgress = effDuration > 0 ? (currentAbsoluteTime / effDuration) * 100 : 0;

      setProgress(Math.min(100, Math.max(0, currentProgress)));
      setTimers({
        current: formatTime(currentAbsoluteTime),
        total: formatTime(effDuration)
      });
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    updateProgress();

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [videoRef, duration, seekOffset]);

  const handleProgressBarClick = (e) => {
    if (!progressBarRef.current) return;

    const effDuration = getEffectiveDuration();
    if (!effDuration) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetSeconds = pos * effDuration;

    if (onSeek) {
      onSeek(targetSeconds);
    }
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
    const nextState = !isMuted;
    videoRef.current.muted = nextState;
    setIsMuted(nextState);
  };

  const selectSubtitle = (index) => {
    const tracks = videoRef.current?.textTracks;
    if (!tracks) return;

    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = i === index ? 'showing' : 'disabled';
    }
    setShowSubMenu(false);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef?.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className={`${styles.controlsContainer} ${visible ? styles.show : ''}`}>
      {/* Barra de Progreso */}
      <div className={styles.progressArea} ref={progressBarRef} onClick={handleProgressBarClick}>
        <div className={styles.progressBase}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          <div className={styles.progressKnob} style={{ left: `${progress}%` }} />
        </div>
      </div>

      {/* Botones de Control */}
      <div className={styles.buttonsRow}>
        <div className={styles.leftBtns}>
          <button onClick={togglePlay} aria-label="Reproducir/Pausar">
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          
          <div className={styles.timerDisplay}>
            <span className={styles.currentTime}>{timers.current}</span>
            <span className={styles.separator}>/</span>
            <span>{timers.total}</span>
          </div>

          <div className={styles.volumeWrapper}>
            <button onClick={toggleMute} aria-label="Mutear">
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
            />
          </div>
        </div>

        <div className={styles.rightBtns}>
          {/* Menú de Subtítulos */}
          <div className={styles.subtitleWrapper}>
            {showSubMenu && (
              <ul className={styles.subtitleMenu}>
                <li onClick={() => selectSubtitle(-1)}>Desactivar</li>
                {subtitles.map((s, i) => (
                  <li key={i} onClick={() => selectSubtitle(i)}>
                    {s.title || s.language?.toUpperCase() || `Pista ${i + 1}`}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowSubMenu(!showSubMenu)} aria-label="Subtítulos">
              <MdSubtitles />
            </button>
          </div>

          {/* Pantalla Completa */}
          <button onClick={toggleFullscreen} aria-label="Pantalla Completa">
            <FiMaximize />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomControls;
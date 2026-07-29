import React, { useState, useEffect, useRef } from 'react';
import styles from './VideoPlayer.module.css';
import { FiPlay, FiPause, FiMaximize, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { MdSubtitles } from 'react-icons/md';

const CustomControls = ({ videoRef, isPlaying, togglePlay, visible, title, subtitles, playerContainerRef }) => {
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [timers, setTimers] = useState({ current: '00:00', total: '00:00' });
  const progressBarRef = useRef(null);

  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    const update = () => {
      setProgress((video.currentTime / video.duration) * 100 || 0);
      setTimers({
        current: formatTime(video.currentTime),
        total: formatTime(video.duration)
      });
    };
    video.addEventListener('timeupdate', update);
    video.addEventListener('loadedmetadata', update);
    return () => {
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('loadedmetadata', update);
    };
  }, [videoRef]);

  const handleSeek = (e) => {
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    videoRef.current.volume = val;
    setIsMuted(val === 0);
  };

  const selectSubtitle = (index) => {
    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = i === index ? 'showing' : 'disabled';
    }
    setShowSubMenu(false);
  };

  return (
    <div className={`${styles.controlsContainer} ${visible ? styles.show : ''}`}>
      <div className={styles.progressArea} ref={progressBarRef} onClick={handleSeek}>
        <div className={styles.progressBase}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          <div className={styles.progressKnob} style={{ left: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.buttonsRow}>
        <div className={styles.leftBtns}>
          <button onClick={togglePlay}>{isPlaying ? <FiPause /> : <FiPlay />}</button>
          
          <div className={styles.timerDisplay}>
            <span className={styles.currentTime}>{timers.current}</span>
            <span className={styles.separator}>/</span>
            <span>{timers.total}</span>
          </div>

          <div className={styles.volumeWrapper}>
            <button onClick={() => { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); }}>
              {isMuted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className={styles.volumeSlider} />
          </div>
        </div>

        <div className={styles.rightBtns}>
          <div className={styles.subtitleWrapper}>
            {showSubMenu && (
              <ul className={styles.subtitleMenu}>
                <li onClick={() => selectSubtitle(-1)}>Desactivar</li>
                {subtitles.map((s, i) => (
                  <li key={i} onClick={() => selectSubtitle(i)}>{s.tags?.language?.toUpperCase() || `Pista ${i + 1}`}</li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowSubMenu(!showSubMenu)}><MdSubtitles /></button>
          </div>
          <button onClick={() => {
  if (!document.fullscreenElement) {
    playerContainerRef.current.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}}><FiMaximize /></button>
        </div>
      </div>
    </div>
  );
};

export default CustomControls;
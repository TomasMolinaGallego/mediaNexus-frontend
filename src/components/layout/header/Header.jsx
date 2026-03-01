import React, { memo, useState, useRef, useEffect } from 'react';
import styles from './Header.module.css';
import appStyles from '../../../styles/App.module.css';
import { useMediaHooksManager } from '../../../hooks/mediaHooksManager.ts';

const SettingsModal = ({ isOpen, onClose }) => {
  const { saveConfig } = useMediaHooksManager();
  const [directories, setDirectories] = useState(() => {
    const saved = localStorage.getItem('alexandria_dirs');
    return saved ? JSON.parse(saved) : [{ alias: '', drive: 'C', path: '' }];
  });

  const handleSave = () => {
    const validDirs = directories.filter(d => d.path.trim() !== '');
    const dataForBack = validDirs.map(d => ({
      alias: d.alias,
      route: `${d.drive.toUpperCase()}:/${d.path.replace(/\\/g, '/')}`
    }));
    
    localStorage.setItem('alexandria_dirs', JSON.stringify(validDirs));
    saveConfig(dataForBack);
    onClose();
  };

  const removeDirectory = () => {

  }

  const updateDirectory = () => {
    
  }

  const addDirectory = () => {
    
  }

  const handleBrowseClick = () => {
    
  }


  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>BIBLIOTECAS LOCALES</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar modal">&times;</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.infoBanner}>
            Vincula tus carpetas locales. Alexandria sincronizará los metadatos automáticamente.
          </p>

          <div className={styles.scrollArea}>
            {directories.map((dir, index) => (
              <div key={index} className={styles.directoryCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.rowNumber}>#{index + 1}</span>
                  <button className={styles.miniRemoveBtn} onClick={() => removeDirectory(index)}>Eliminar</button>
                </div>
                
                <div className={styles.cardGrid}>
                  <div className={styles.inputGroup}>
                    <label>ALIAS</label>
                    <input
                      type="text"
                      placeholder="Ej: Anime"
                      value={dir.alias}
                      onChange={(e) => updateDirectory(index, 'alias', e.target.value)}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>UNIDAD</label>
                    <input
                      className={styles.driveInput}
                      type="text"
                      maxLength="1"
                      value={dir.drive}
                      onChange={(e) => updateDirectory(index, 'drive', e.target.value)}
                    />
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>RUTA DE CARPETA</label>
                    <div className={styles.pathWrapper}>
                      <input
                        type="text"
                        value={dir.path}
                        onChange={(e) => updateDirectory(index, 'path', e.target.value)}
                      />
                      <button className={styles.browseBtn} onClick={() => handleBrowseClick(index)}>📂</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className={styles.addBtn} onClick={addDirectory}>+ AÑADIR NUEVA RUTA</button>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.saveButton} onClick={handleSave}>GUARDAR CAMBIOS</button>
        </div>
      </div>
    </div>
  );
};

const Header = memo(({ onSearch, isInsideMedia, onBackClick, onMenuClick }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setIsSettingsOpen(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.topRow}>
          <div className={styles.brand}>
            <h1 className={styles.title} onClick={onBackClick} role="button">
              ALEXANDRIA<span>_MEDIA</span>
            </h1>
          </div>
          
          <div className={styles.actions}>
            <button 
              className={styles.settingsBtn} 
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Configuración de bibliotecas"
            >⚙️</button>
          </div>
        </div>

        <div className={styles.controlsRow}>
          {isInsideMedia && (
            <button className={styles.backButton} onClick={onBackClick}>
              <span className={styles.backArrow}>←</span> VOLVER
            </button>
          )}
          
          <div className={styles.searchWrapper}>
            <input 
              type="text" 
              placeholder="Buscar series o episodios..." 
              className={styles.searchBar} 
              onChange={(e) => onSearch(e.target.value)} 
            />
            <span className={styles.searchIcon} aria-hidden="true">🔍</span>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </header>
  );
});

export default Header;
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from './Header.module.css';
import { useMediaHooksManager } from '../../../hooks/mediaHooksManager.ts';

const SettingsModal = ({ isOpen, onClose, currentTheme }) => {
  const { saveConfig } = useMediaHooksManager();
  
  const [directories, setDirectories] = useState(() => {
    try {
      const saved = localStorage.getItem('alexandria_dirs');
      return saved ? JSON.parse(saved) : [{ id: Date.now(), alias: '', drive: 'C', path: '' }];
    } catch {
      return [{ id: Date.now(), alias: '', drive: 'C', path: '' }];
    }
  });

  // Cerrar modal al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    const validDirs = directories.filter((d) => d.path.trim() !== '');
    const dataForBack = validDirs.map((d) => {
      const cleanPath = d.path.replace(/\\/g, '/').replace(/^\/+/, '');
      return {
        alias: d.alias,
        route: `${d.drive.toUpperCase()}:/${cleanPath}`,
      };
    });

    localStorage.setItem('alexandria_dirs', JSON.stringify(validDirs));
    saveConfig(dataForBack);
    onClose();
  };

  const addDirectory = () => {
    setDirectories((prev) => [
      ...prev,
      { id: Date.now(), alias: '', drive: 'C', path: '' },
    ]);
  };

  const updateDirectory = (id, field, value) => {
    setDirectories((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const removeDirectory = (id) => {
    setDirectories((prev) => prev.filter((d) => d.id !== id));
  };

  return ReactDOM.createPortal(
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id="modal-title">
            {currentTheme === 'nier' ? 'BIBLIOTECAS_SISTEMA' : 'DIRECTORIOS DEL SISTEMA'}
          </h2>
          <button 
            className={styles.closeBtn} 
            onClick={onClose} 
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.scrollArea}>
            {directories.map((dir) => (
              <div key={dir.id} className={styles.directoryCard}>
                <div className={styles.cardGrid}>
                  <div className={styles.inputGroup}>
                    <label>ALIAS</label>
                    <input
                      type="text"
                      value={dir.alias}
                      onChange={(e) => updateDirectory(dir.id, 'alias', e.target.value)}
                      placeholder="Ej: Anime..."
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>UNIDAD</label>
                    <select
                      value={dir.drive}
                      onChange={(e) => updateDirectory(dir.id, 'drive', e.target.value)}
                      className={styles.driveSelect}
                    >
                      {['C', 'D', 'E', 'F', 'G', 'H', 'Z'].map((drive) => (
                        <option key={drive} value={drive}>
                          {drive}:
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                    <label>RUTA RELATIVA</label>
                    <input
                      type="text"
                      value={dir.path}
                      onChange={(e) => updateDirectory(dir.id, 'path', e.target.value)}
                      placeholder="Ej: Media/Series"
                    />
                  </div>
                </div>

                {directories.length > 1 && (
                  <button
                    className={styles.removeCardBtn}
                    onClick={() => removeDirectory(dir.id)}
                    aria-label="Eliminar directorio"
                  >
                    ELIMINAR
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className={styles.addBtn} onClick={addDirectory}>
            + AÑADIR NUEVA RUTA
          </button>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.saveButton} onClick={handleSave}>
            GUARDAR_CAMBIOS
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
export default SettingsModal;

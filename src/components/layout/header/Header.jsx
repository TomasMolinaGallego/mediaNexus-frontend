import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom'; // Para el Portal
import styles from './Header.module.css';
import { useMediaHooksManager } from '../../../hooks/mediaHooksManager.ts';

// Componente Modal Extraído para mayor claridad
const SettingsModal = ({ isOpen, onClose, currentTheme }) => {
  const { saveConfig } = useMediaHooksManager();
  const [directories, setDirectories] = useState(() => {
    const saved = localStorage.getItem('alexandria_dirs');
    return saved ? JSON.parse(saved) : [{ id: Date.now(), alias: '', drive: 'C', path: '' }];
  });

  if (!isOpen) return null;

  const handleSave = () => {
    const validDirs = directories.filter(d => d.path.trim() !== '');
    const dataForBack = validDirs.map(d => {
      // Limpieza de barras dobles y normalización
      const cleanPath = d.path.replace(/\\/g, '/').replace(/^\/+/, '');
      return {
        alias: d.alias,
        route: `${d.drive.toUpperCase()}:/${cleanPath}`
      };
    });
    localStorage.setItem('alexandria_dirs', JSON.stringify(validDirs));
    saveConfig(dataForBack);
    onClose();
  };

  const addDirectory = () => {
    setDirectories([...directories, { id: Date.now(), alias: '', drive: 'C', path: '' }]);
  };

  const updateDirectory = (id, field, value) => {
    setDirectories(directories.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  // Renderizamos vía Portal para evitar conflictos de CSS con el Header
  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          {/* Usamos la prop currentTheme en lugar de leer el DOM */}
          <h2>{currentTheme === 'nier' ? 'BIBLIOTECAS_SISTEMA' : 'SYSTEM_DIRECTORIES'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.scrollArea}>
            {directories.map((dir) => (
              <div key={dir.id} className={styles.directoryCard}>
                <div className={styles.cardGrid}>
                  {/* Inputs con su lógica de updateDirectory usando ID */}
                  <input
                    value={dir.alias}
                    onChange={e => updateDirectory(dir.id, 'alias', e.target.value)}
                    placeholder="Alias..."
                  />
                  {/* ... resto de inputs */}
                </div>
              </div>
            ))}
          </div>
          <button className={styles.addBtn} onClick={addDirectory}>+ AÑADIR NUEVA RUTA</button>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.saveButton} onClick={handleSave}>GUARDAR_CAMBIOS</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/**
 * Header Principal con Buscador Unificado
 * Permite alternar entre búsqueda Local (archivos propios) y Externa (catálogo).
 */
// Definimos los temas disponibles fuera del componente para evitar recreaciones
const THEMES = [
  { id: 'netflix', name: 'NETFLIX' },
  { id: 'nier', name: 'NIER: REPLICANT' },
  { id: 'yorha', name: 'YORHA (NIER: AUTOMATA)' },
  { id: 'tactical', name: 'TACTICAL' },
  { id: 'final-fantasy', name: 'FF VII CLASSIC' },
  { id: 'ff13', name: 'FF XIII COCOON' }
];
const Header = memo(({ onSearch, isInsideMedia, onBackClick, onExternalSearch, onModeChange, isLoading, setGlobalTheme, activateEndingE }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'netflix');
  const [searchMode, setSearchMode] = useState('local');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    setGlobalTheme(theme); // Actualizamos el estado global del padre
  }, [theme, setGlobalTheme]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  // Maneja el cambio de tab y limpia datos antiguos inmediatamente
  const handleTabChange = (newMode) => {
    if (newMode === searchMode) return;

    setSearchMode(newMode);
    onModeChange(newMode); // App.js reacciona al instante

    // Limpiamos los resultados en el manager para no ver rastro del anterior
    onSearch('');
    onExternalSearch('');
  };

  useEffect(() => {
    if (!query.trim()) return;
    console.log(`Ejecutando búsqueda en modo: ${searchMode} con query: "${query}"`);
    if (searchMode === 'local' && query.toLocaleLowerCase() === 'ending_e' && theme === 'yorha') {
      activateEndingE(true);
    }

    const timer = setTimeout(() => {
      if (searchMode === 'local') {
        onSearch(query);
      } else {
        onExternalSearch(query);
      }
    }, 10);

    return () => clearTimeout(timer);
  }, [searchMode, query]); // Quitamos onSearch de aquí para evitar loops

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (searchMode === 'local') {
      onSearch(val);
    } else {
      onExternalSearch(val);
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    onExternalSearch('');
  };

  const toggleTheme = () => {
    const themes = THEMES.map(t => t.id);
    setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
    setGlobalTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.topRow}>
          <div className={styles.brand} onClick={onBackClick}>
            <h1 className={styles.title}>
              ALEXANDRIA<span>{
                theme === 'netflix' ? '_LIBRARY' :
                  theme === 'nier' ? '_LIBRARY' : '_LIBRARY'
              }</span>
            </h1>
          </div>

          <div className={styles.themeDropdownWrapper}>
            <label htmlFor="theme-select" className={styles.hiddenLabel}>Tema:</label>
            <select
              id="theme-select"
              className={styles.themeSelect}
              value={theme}
              onChange={handleThemeChange}
            >
              {THEMES.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.tabContainer}>
            <button
              className={`${styles.tab} ${searchMode === 'local' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('local')}
            >
              {theme === 'nier' ? 'ARCHIVO_LOCAL' : 'MI BIBLIOTECA'}
            </button>
            <button
              className={`${styles.tab} ${searchMode === 'external' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('external')}
            >
              {theme === 'nier' ? 'RED_EXTERNA' : 'CATÁLOGO GLOBAL'}
            </button>
          </div>

          <div className={styles.searchWrapper}>

            {isInsideMedia && (
              <button className={styles.backButton} onClick={onBackClick}>VOLVER</button>
            )}

            <div className={`${styles.inputContainer} ${isLoading ? styles.loading : ''}`} data-mode={searchMode}>
              <span className={styles.searchIcon}>
                {isLoading ? '⏳' : (searchMode === 'local' ? '🏠' : '🌍')}
              </span>

              <input
                type="text"
                value={query}
                placeholder={searchMode === 'local' ? "Buscar en tus discos..." : "Buscar en internet..."}
                className={styles.searchBar}
                onChange={handleInputChange}
                autoFocus
              />

              {query && !isLoading && (
                <button className={styles.clearBtn} onClick={clearSearch}>&times;</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} currentTheme={theme} />
    </header>
  );
});

export default Header;

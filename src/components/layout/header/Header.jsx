import React, { memo, useState, useEffect, useCallback } from 'react';
import styles from './Header.module.css';
import SettingsModal from './SettingsModal';

const THEMES = [
  { id: 'netflix', name: 'NETFLIX' },
  { id: 'nier', name: 'NIER: REPLICANT' },
  { id: 'yorha', name: 'YORHA (NIER: AUTOMATA)' },
  { id: 'tactical', name: 'TACTICAL' },
  { id: 'final-fantasy', name: 'FF VII CLASSIC' },
  { id: 'ff13', name: 'FF XIII COCOON' },
];

const Header = memo(({
  onSearch,
  isInsideMedia,
  onBackClick,
  onExternalSearch,
  onModeChange,
  isLoading,
  setGlobalTheme,
  activateEndingE
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'netflix');
  const [searchMode, setSearchMode] = useState('local');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (typeof setGlobalTheme === 'function') {
      setGlobalTheme(theme);
    }
  }, [theme, setGlobalTheme]);

  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  // Cambio de Modo de Búsqueda (Local / Global)
  const handleTabChange = useCallback((newMode) => {
    if (newMode === searchMode) return;

    setSearchMode(newMode);
    if (typeof onModeChange === 'function') {
      onModeChange(newMode);
    }

    setQuery('');
    onSearch('');
    onExternalSearch('');
  }, [searchMode, onModeChange, onSearch, onExternalSearch]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (
      searchMode === 'local' &&
      trimmedQuery.toLowerCase() === 'ending_e' &&
      theme === 'yorha' &&
      typeof activateEndingE === 'function'
    ) {
      activateEndingE(true);
    }

    const timer = setTimeout(() => {
      if (searchMode === 'local') {
        onSearch(trimmedQuery);
      } else {
        onExternalSearch(trimmedQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMode, theme, activateEndingE, onSearch, onExternalSearch]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    onExternalSearch('');
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.topRow}>
          <div className={styles.brand} onClick={onBackClick} role="button" tabIndex={0}>
            <h1 className={styles.title}>
              ALEXANDRIA<span>_LIBRARY</span>
            </h1>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.settingsBtn}
              onClick={() => setIsSettingsOpen(true)}
              title="Configuración"
              aria-label="Abrir configuración"
            >
              ⚙️
            </button>

            <div className={styles.themeDropdownWrapper}>
              <label htmlFor="theme-select" className={styles.hiddenLabel}>
                Tema:
              </label>
              <select
                id="theme-select"
                className={styles.themeSelect}
                value={theme}
                onChange={handleThemeChange}
              >
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
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
              <button className={styles.backButton} onClick={onBackClick}>
                VOLVER
              </button>
            )}

            <div
              className={`${styles.inputContainer} ${isLoading ? styles.loading : ''}`}
              data-mode={searchMode}
            >
              <span className={styles.searchIcon}>
                {isLoading ? '⏳' : searchMode === 'local' ? '🏠' : '🌍'}
              </span>

              <input
                type="text"
                value={query}
                placeholder={
                  searchMode === 'local'
                    ? 'Buscar en tus discos...'
                    : 'Buscar en internet...'
                }
                className={styles.searchBar}
                onChange={handleInputChange}
                autoFocus
              />

              {query && !isLoading && (
                <button
                  className={styles.clearBtn}
                  onClick={clearSearch}
                  aria-label="Limpiar búsqueda"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
      />
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
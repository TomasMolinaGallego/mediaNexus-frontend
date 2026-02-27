import React, { memo } from 'react';
import styles from './Header.module.css';
import appStyles from '../../../styles/App.module.css';

/**
 * Header Component - Original Noir Style
 */
const Header = memo(({ 
  onSearch, 
  filterStatuses, 
  filteredStatus, 
  onFilterChange, 
  isInsideMedia, 
  onBackClick,
  onMenuClick 
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        
        {/* Fila Superior: Logo y Hamburguesa */}
        <div className={styles.topRow}>
          <button className={styles.menuToggle} onClick={onMenuClick}>
            ☰
          </button>
          
          <h1 className={styles.title} onClick={onBackClick}>
            ALEXANDRIA_<span>MEDIA</span>
          </h1>
          
          <div className={styles.placeholder} />
        </div>

        {/* Fila Inferior: Buscador y Filtros */}
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder={isInsideMedia ? "Buscar episodio..." : "Buscar en la biblioteca..."}
              className={styles.searchBar}
              onChange={(e) => onSearch(e.target.value)}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          <div className={styles.navigation}>
            {isInsideMedia ? (
              <button 
                className={`${appStyles.button} ${styles.backButton}`} 
                onClick={onBackClick}
              >
                ← VOLVER
              </button>
            ) : (
              <div className={styles.filterGroup} role="group" aria-label="Filter Media">
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
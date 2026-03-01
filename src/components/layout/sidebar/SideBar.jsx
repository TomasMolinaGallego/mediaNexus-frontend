import React, { memo, useState, useCallback } from 'react';
import styles from './SideBar.module.css';
import {
  FiGrid, FiPlayCircle, FiCheckCircle, FiChevronLeft,
  FiChevronRight, FiHardDrive, FiClock, FiAlertCircle
} from 'react-icons/fi';
import ReplaySection from '../replaySection/ReplaySection.jsx';

const NavItem = ({ icon, label, active, onClick, collapsed, badge }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <li 
      className={`${styles.navItem} ${active ? styles.active : ''}`} 
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={active}
      aria-label={`${label} (${badge || 0} elementos)`}
    >
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      {!collapsed && <span className={styles.label}>{label}</span>}
      {!collapsed && badge !== undefined && <span className={styles.badge}>{badge}</span>}
      {active && <div className={styles.activeIndicator} />}
    </li>
  );
};

const SideBar = memo(({ onStatusFilter, activeStatus, stats, lastWatched, disks, onClickLastWatched }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const handleNavigation = (targetEpisode) => {
    if (targetEpisode) {
      onClickLastWatched(targetEpisode, lastWatched.aliasRoute, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <aside 
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      aria-expanded={!isCollapsed}
    >
      <button 
        className={styles.toggleBtn} 
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
      </button>

      <div className={styles.logoSection}>
        <div className={styles.logoIcon} aria-hidden="true">A</div>
        {!isCollapsed && <span className={styles.logoText}>ALEXANDRIA</span>}
      </div>

      <nav className={styles.navGroup}>
        <p className={styles.groupTitle} aria-hidden="true">
          {!isCollapsed ? 'Biblioteca' : ''}
        </p>
        <ul className={styles.navList}>
          <NavItem
            icon={<FiGrid />} label="Total"
            active={activeStatus === 'Todos'}
            onClick={() => onStatusFilter('Todos')}
            collapsed={isCollapsed}
            badge={stats?.total}
          />
          <NavItem
            icon={<FiPlayCircle />} label="Viendo"
            active={activeStatus === 'Viendo'}
            onClick={() => onStatusFilter('Viendo')}
            collapsed={isCollapsed}
            badge={stats?.watching}
          />
          <NavItem
            icon={<FiClock />} label="Pendientes"
            active={activeStatus === 'Pendiente'}
            onClick={() => onStatusFilter('Pendiente')}
            collapsed={isCollapsed}
            badge={stats?.planToWatch}
          />
          <NavItem
            icon={<FiCheckCircle />} label="Completados"
            active={activeStatus === 'Completado'}
            onClick={() => onStatusFilter('Completado')}
            collapsed={isCollapsed}
            badge={stats?.completed}
          />
        </ul>
      </nav>

      {!isCollapsed && (
        <div className={styles.bottomContent}>
          <ReplaySection onClickLastWatched={handleNavigation} lastWatched={lastWatched} />

          <div className={styles.extraSection}>
            <p className={styles.groupTitle}>Almacenamiento</p>
            {disks?.map(disk => {
              const isFull = parseFloat(disk.percentage) > 90;
              return (
                <div key={disk.id} className={styles.diskItem}>
                  <div className={styles.diskHeader}>
                    <div className={styles.diskName}>
                      <FiHardDrive size={12} />
                      <span>{disk.name}</span>
                    </div>
                    <span className={styles.usageText}>{disk.used} / {disk.total}</span>
                  </div>
                  <div className={styles.diskBar}>
                    <div 
                      className={`${styles.diskProgress} ${isFull ? styles.diskFull : ''}`}
                      style={{ width: disk.percentage }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
});

SideBar.displayName = 'SideBar';
export default SideBar;
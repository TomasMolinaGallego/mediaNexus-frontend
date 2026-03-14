import styles from './MediaList.module.css';

const MediaSkeleton = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonImage} />
    <div className={styles.skeletonContent}>
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonFooter} />
    </div>
  </div>
);

export default MediaSkeleton;
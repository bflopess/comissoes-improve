import styles from './StatsCard.module.css';

interface StatsCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    icon?: React.ReactNode;
}

export default function StatsCard({ title, value, trend, trendDirection = 'neutral' }: StatsCardProps) {
    return (
        <div className={styles.card}>
            <h3 className={styles.title}>{title}</h3>
            <div className={styles.value}>{value}</div>
            {trend && (
                <div className={`${styles.trend} ${styles[trendDirection]}`}>
                    {trend}
                </div>
            )}
        </div>
    );
}

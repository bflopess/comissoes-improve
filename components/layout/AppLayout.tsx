import Sidebar from './Sidebar';
import Header from './Header';
import styles from './AppLayout.module.css';
import { db } from '@/lib/db';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const user = await db.getCurrentUser();

    return (
        <div className={styles.container}>
            <Sidebar user={user} />
            <div className={styles.mainWrapper}>
                <Header user={user} />
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}

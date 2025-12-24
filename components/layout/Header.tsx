import styles from './Header.module.css';
import { User } from '@/types';

export default function Header({ user }: { user: User | null }) {
    return (
        <header className={styles.header}>
            <div className={styles.title}>
                <h1>Painel</h1>
            </div>
            <div className={styles.actions}>
                {user ? (
                    <div className={styles.user}>
                        <div className={styles.avatar}>
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name} />
                            ) : (
                                user.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <span>{user.name}</span>
                        <form action="/api/auth/signout" method="post" className="ml-4">
                            <button type="submit" className="text-sm text-red-500 hover:text-red-700 underline bg-transparent border-none cursor-pointer">
                                Sair
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className={styles.user}>
                        <span>Convidado</span>
                    </div>
                )}
            </div>
        </header>
    );
}

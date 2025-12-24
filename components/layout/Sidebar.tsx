import Link from 'next/link';
import styles from './Sidebar.module.css';
import { User } from '@/types';

const menuItems = [
    { label: 'Painel', href: '/' },
    { label: 'Vendas', href: '/sales' },
    { label: 'Comissões', href: '/commissions' },
    { label: 'Produtos', href: '/products' },
    { label: 'Usuários', href: '/users', roles: ['admin', 'Admin'] },
];

export default function Sidebar({ user }: { user: User | null }) {
    // Filter items based on user role
    const filteredItems = menuItems.filter(item => {
        if (!item.roles) return true;
        return user && item.roles.includes(user.role);
    });

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <h2>Improve</h2>
            </div>
            <nav className={styles.nav}>
                <ul>
                    {filteredItems.map((item) => (
                        <li key={item.href}>
                            <Link href={item.href} className={styles.link}>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className={styles.footer}>
                <p>v1.0.0</p>
            </div>
        </aside>
    );
}

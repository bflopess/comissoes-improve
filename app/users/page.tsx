'use client';

import { useState, useEffect } from 'react';
import UserList from '@/components/users/UserList';
import styles from './page.module.css';
import { User } from '@/types';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching users', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Carregando...</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Gestão de Usuários</h1>
            <UserList users={users} />
        </div>
    );
}

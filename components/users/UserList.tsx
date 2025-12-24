'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User } from '@/types';
import styles from './UserList.module.css';

interface UserListProps {
    users: User[];
}

export default function UserList({ users: initialUsers }: UserListProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);

    const handleDelete = async (user: User) => {
        if (!confirm(`Tem certeza que deseja desativar o usuário ${user.name}?`)) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: false } : u));
            } else {
                alert('Erro ao desativar usuário');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao desativar usuário');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Equipe</h2>
                <Link href="/users/new" className="btn btn-primary">Novo Usuário</Link>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Email</th>
                            <th>Função</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className={!user.active ? styles.inactiveRow : ''}>
                                <td>
                                    <div className={styles.userInfo}>
                                        {user.avatarUrl && <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />}
                                        <span>{user.name}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`${styles.role} ${styles[user.role]}`}>
                                        {user.role === 'admin' ? 'Admin' : user.role === 'manager' ? 'Gerente' : 'Vendedor'}
                                    </span>
                                </td>
                                <td>
                                    <span className={user.active ? styles.active : styles.inactive}>
                                        {user.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className={styles.actions}>
                                    <Link href={`/users/${user.id}`} className={styles.editButton}>
                                        Editar
                                    </Link>
                                    {user.active && (
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className={styles.deleteButton}
                                            style={{ marginLeft: '10px', color: 'red', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Desativar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

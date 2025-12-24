'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import UserForm from '@/components/users/UserForm';
import styles from './page.module.css';
import { User } from '@/types';

export default function EditUserPage() {
    const params = useParams();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetch(`/api/users/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        alert('Usuário não encontrado');
                    } else {
                        setUser(data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching user', err);
                    setLoading(false);
                });
        }
    }, [params.id]);

    if (loading) return <div>Carregando...</div>;
    if (!user) return <div>Usuário não encontrado</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Editar Usuário</h1>
            <UserForm initialData={user} />
        </div>
    );
}

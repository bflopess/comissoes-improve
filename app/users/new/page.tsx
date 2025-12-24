'use client';

import UserForm from '@/components/users/UserForm';
import styles from './page.module.css';

export default function NewUserPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Novo Usuário</h1>
            <UserForm />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Role } from '@/types';
import styles from './UserForm.module.css';

interface UserFormProps {
    initialData?: User;
}

export default function UserForm({ initialData }: UserFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'salesperson' as Role,
        active: true,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                email: initialData.email,
                role: initialData.role,
                active: initialData.active,
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = initialData ? `/api/users/${initialData.id}` : '/api/users';
            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/users'); // Assuming there is a users list page, though not explicitly requested, it's implied by "Menu Usuários"
                router.refresh();
            } else {
                alert('Erro ao salvar usuário');
            }
        } catch (error) {
            console.error('Error saving user', error);
            alert('Erro ao salvar usuário');
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
                <div className={styles.field}>
                    <label htmlFor="name">Nome</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="role">Função</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        <option value="salesperson">Vendedor</option>
                        <option value="manager">Gerente</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>

                <div className={styles.checkboxField}>
                    <label>
                        <input
                            type="checkbox"
                            name="active"
                            checked={formData.active}
                            onChange={handleChange}
                        />
                        Ativo
                    </label>
                </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px' }}>
                <p style={{ color: '#1d4ed8', fontSize: '0.875rem', margin: 0 }}>
                    <strong>Atenção:</strong> Ao criar um usuário aqui, você está criando apenas o perfil no sistema.
                    O usuário deverá <strong>Criar Conta</strong> na tela de login usando este mesmo email para definir sua senha e acessar o sistema.
                </p>
            </div>



            <div className={styles.actions}>
                <button type="button" className="btn" onClick={() => router.back()}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{initialData ? 'Atualizar Usuário' : 'Salvar Usuário'}</button>
            </div>
        </form>
    );
}

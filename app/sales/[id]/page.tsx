'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SaleForm from '@/components/sales/SaleForm';
import styles from './page.module.css';
import { Sale } from '@/types';

export default function EditSalePage() {
    const params = useParams();
    const [sale, setSale] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetch(`/api/sales/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        alert('Venda não encontrada');
                    } else {
                        setSale(data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching sale', err);
                    setLoading(false);
                });
        }
    }, [params.id]);

    if (loading) return <div>Carregando...</div>;
    if (!sale) return <div>Venda não encontrada</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Editar Venda</h1>
            <SaleForm initialData={sale} />
        </div>
    );
}

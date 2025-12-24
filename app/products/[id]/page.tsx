'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ProductForm from '@/components/products/ProductForm';
import styles from './page.module.css';
import { Product } from '@/types';

export default function EditProductPage() {
    const params = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetch(`/api/products/${params.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        alert('Produto não encontrado');
                    } else {
                        setProduct(data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error fetching product', err);
                    setLoading(false);
                });
        }
    }, [params.id]);

    if (loading) return <div>Carregando...</div>;
    if (!product) return <div>Produto não encontrado</div>;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Editar Produto</h1>
            <ProductForm initialData={product} />
        </div>
    );
}

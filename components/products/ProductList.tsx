'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import styles from './ProductList.module.css';
import Link from 'next/link';

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch products', err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Carregando produtos...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Todos os Produtos</h2>
                <Link href="/products/new" className="btn btn-primary">
                    Novo Produto
                </Link>
            </div>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th>Comissão Base (%)</th>
                            <th>Tipo Comissão</th>
                            <th>Custo Base</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id} className={!product.active ? styles.inactiveRow : ''}>
                                <td>{product.name}</td>
                                <td>{product.description}</td>
                                <td>{product.baseCommissionRate}%</td>
                                <td>{product.commissionType === 'percentage_on_sale' ? '% Venda' : '% Lucro'}</td>
                                <td>{product.baseCost ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.baseCost) : '-'}</td>
                                <td>
                                    <span className={product.active ? styles.statusActive : styles.statusInactive}>
                                        {product.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td className={styles.actionsCell}>
                                    <Link href={`/products/${product.id}`} className={styles.actionButton}>
                                        Editar
                                    </Link>
                                    {product.active && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Tem certeza que deseja desativar este produto?')) {
                                                    fetch(`/api/products/${product.id}`, { method: 'DELETE' })
                                                        .then(() => {
                                                            setProducts(products.map(p => p.id === product.id ? { ...p, active: false } : p));
                                                        })
                                                        .catch(err => alert('Erro ao desativar'));
                                                }
                                            }}
                                            className={styles.deleteButton}
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

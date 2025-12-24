'use client';

import { useState, useEffect } from 'react';
import { Product, CommissionType } from '@/types';
import styles from './ProductForm.module.css';
import { useRouter } from 'next/navigation';

interface ProductFormProps {
    initialData?: Product;
}

export default function ProductForm({ initialData }: ProductFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        baseCommissionRate: '',
        commissionType: 'percentage_on_sale' as CommissionType,
        baseCost: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                description: initialData.description || '',
                baseCommissionRate: initialData.baseCommissionRate.toString(),
                commissionType: initialData.commissionType,
                baseCost: initialData.baseCost ? initialData.baseCost.toString() : '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = initialData ? `/api/products/${initialData.id}` : '/api/products';
            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/products');
                router.refresh();
            } else {
                alert('Erro ao salvar produto');
            }
        } catch (error) {
            console.error('Error saving product', error);
            alert('Erro ao salvar produto');
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
                <div className={styles.field}>
                    <label htmlFor="name">Nome do Produto</label>
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
                    <label htmlFor="baseCommissionRate">Taxa de Comissão Base (%)</label>
                    <input
                        type="number"
                        id="baseCommissionRate"
                        name="baseCommissionRate"
                        value={formData.baseCommissionRate}
                        onChange={handleChange}
                        required
                        min="0"
                        max="100"
                        step="0.1"
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor="commissionType">Tipo de Comissão</label>
                    <select
                        id="commissionType"
                        name="commissionType"
                        value={formData.commissionType}
                        onChange={handleChange}
                        className={styles.select}
                    >
                        <option value="percentage_on_sale">% sobre Venda</option>
                        <option value="percentage_on_profit">% sobre Lucro</option>
                    </select>
                </div>

                {formData.commissionType === 'percentage_on_profit' && (
                    <div className={styles.field}>
                        <label htmlFor="baseCost">Custo Base (R$)</label>
                        <input
                            type="number"
                            id="baseCost"
                            name="baseCost"
                            value={formData.baseCost}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            className={styles.input}
                        />
                    </div>
                )}

                <div className={styles.fullWidthField}>
                    <label htmlFor="description">Descrição</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={styles.textarea}
                        rows={3}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                <button type="button" className="btn" onClick={() => router.back()}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{initialData ? 'Atualizar Produto' : 'Salvar Produto'}</button>
            </div>
        </form>
    );
}

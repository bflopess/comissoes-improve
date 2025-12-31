'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Product, Sale } from '@/types';
import styles from './SaleForm.module.css';

interface SaleFormProps {
    initialData?: Sale;
}

export default function SaleForm({ initialData }: SaleFormProps) {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [formData, setFormData] = useState({
        clientType: 'adult',
        responsibleName: '',
        studentName: '',
        salespersonId: '',
        productId: '',
        campaign: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        installments: '1',
        installmentStartDate: new Date().toISOString().split('T')[0],
        dueDay: '10',
        paymentMethod: '',
    });

    useEffect(() => {
        // Fetch users and products
        Promise.all([
            fetch('/api/users').then(res => res.json()),
            fetch('/api/products').then(res => res.json())
        ]).then(([usersData, productsData]) => {
            setUsers(usersData.filter((u: User) => u.role === 'salesperson'));
            setProducts(productsData);
        });

        if (initialData) {
            setFormData({
                clientType: initialData.clientType || 'adult',
                responsibleName: initialData.responsibleName,
                studentName: initialData.studentName || '',
                salespersonId: initialData.salespersonId,
                productId: initialData.productId,
                campaign: initialData.campaign || '',
                amount: initialData.amount.toString(),
                date: new Date(initialData.date).toISOString().split('T')[0],
                installments: initialData.installments.length.toString(),
                installmentStartDate: initialData.installmentStartDate ? new Date(initialData.installmentStartDate).toISOString().split('T')[0] : '',
                dueDay: initialData.dueDay?.toString() || '10',
                paymentMethod: initialData.paymentMethod || '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = initialData ? `/api/sales/${initialData.id}` : '/api/sales';
            const method = initialData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/sales');
                router.refresh();
            } else {
                alert('Erro ao salvar venda');
            }
        } catch (error) {
            console.error('Error saving sale', error);
            alert('Erro ao salvar venda');
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid}>
                {/* Client Details */}
                <div className={styles.section}>
                    <h3>Dados do Cliente</h3>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="clientType">Tipo de Cliente</label>
                            <select
                                id="clientType"
                                name="clientType"
                                value={formData.clientType}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="adult">Responsável (Adulto)</option>
                                <option value="student">Aluno (Menor)</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="responsibleName">Nome do Responsável</label>
                            <input
                                type="text"
                                id="responsibleName"
                                name="responsibleName"
                                value={formData.responsibleName}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </div>
                        {formData.clientType === 'student' && (
                            <div className={styles.field}>
                                <label htmlFor="studentName">Nome do Aluno</label>
                                <input
                                    type="text"
                                    id="studentName"
                                    name="studentName"
                                    value={formData.studentName}
                                    onChange={handleChange}
                                    required
                                    className={styles.input}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Sale Details */}
                <div className={styles.section}>
                    <h3>Dados da Venda</h3>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="salespersonId">Vendedor</label>
                            <select
                                id="salespersonId"
                                name="salespersonId"
                                value={formData.salespersonId}
                                onChange={handleChange}
                                required
                                className={styles.select}
                            >
                                <option value="">Selecione...</option>
                                {users.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="productId">Produto</label>
                            <select
                                id="productId"
                                name="productId"
                                value={formData.productId}
                                onChange={handleChange}
                                required
                                className={styles.select}
                            >
                                <option value="">Selecione...</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>{product.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="campaign">Campanha (Opcional)</label>
                            <select
                                id="campaign"
                                name="campaign"
                                value={formData.campaign}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="">Nenhuma</option>
                                <option value="Black Friday">Black Friday</option>
                                <option value="Volta às Aulas">Volta às Aulas</option>
                                <option value="Indicação">Indicação</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="amount">Valor Total (R$)</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                min="0"
                                step="0.01"
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="date">Data da Venda</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </div>
                    </div>
                </div>

                {/* Installments */}
                <div className={styles.section}>
                    <h3>Pagamento</h3>
                    {initialData && (
                        <div className={styles.warning}>
                            Atenção: Ao alterar o número de parcelas, todas as parcelas antigas serão excluídas e recriadas!
                        </div>
                    )}
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="paymentMethod">Forma de Pagamento</label>
                            <select
                                id="paymentMethod"
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                required
                                className={styles.select}
                            >
                                <option value="">Selecione...</option>
                                <option value="credit">Cartão de Crédito</option>
                                <option value="debit">Cartão de Débito</option>
                                <option value="pix">PIX</option>
                                <option value="boleto">Boleto</option>
                                <option value="cash">Dinheiro</option>
                                <option value="check">Cheque</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="installments">Número de Parcelas</label>
                            <select
                                id="installments"
                                name="installments"
                                value={formData.installments}
                                onChange={handleChange}
                                className={styles.select}
                            // Disabled removed to allow editing
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                    <option key={num} value={num}>{num}x</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="installmentStartDate">1ª Parcela em</label>
                            <input
                                type="date"
                                id="installmentStartDate"
                                name="installmentStartDate"
                                value={formData.installmentStartDate}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="dueDay">Dia de Vencimento</label>
                            <input
                                type="number"
                                id="dueDay"
                                name="dueDay"
                                value={formData.dueDay}
                                onChange={handleChange}
                                required
                                min="1"
                                max="31"
                                className={styles.input}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <button type="button" className="btn" onClick={() => router.back()}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{initialData ? 'Atualizar Venda' : 'Salvar Venda'}</button>
            </div>
        </form>
    );
}

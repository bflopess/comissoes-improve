'use client';

import { useState, useEffect } from 'react';
import { Sale } from '@/types';
import styles from './SalesList.module.css';
import Link from 'next/link';

export default function SalesList() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [users, setUsers] = useState<any[]>([]); // simplified user type or import User
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedSalesperson, setSelectedSalesperson] = useState('');

    useEffect(() => {
        Promise.all([
            fetch('/api/sales').then(res => res.json()),
            fetch('/api/users').then(res => res.json())
        ]).then(([salesData, usersData]) => {
            setSales(salesData);
            setUsers(usersData.filter((u: any) => u.role === 'salesperson'));
            setLoading(false);
        }).catch(err => {
            console.error('Failed to fetch data', err);
            setLoading(false);
        });
    }, []);

    const handleDelete = async (sale: Sale) => {
        const hasPaidCommission = sale.installments.some(i => i.sellerPaid);

        if (hasPaidCommission) {
            alert('Esta venda possui comissões já pagas ao vendedor. Não é possível excluir automaticamente. Por favor, desmarque o pagamento da comissão antes de excluir.');
            return;
        }

        if (!confirm('Tem certeza que deseja excluir esta venda? Todas as parcelas e comissões serão apagadas.')) {
            return;
        }

        try {
            const res = await fetch(`/api/sales/${sale.id}`, { method: 'DELETE' });
            if (res.ok) {
                setSales(sales.filter(s => s.id !== sale.id));
            } else {
                alert('Erro ao excluir venda.');
            }
        } catch (error) {
            alert('Erro ao excluir venda.');
        }
    };

    const filteredSales = sales.filter(sale => {
        const saleMonth = sale.date.slice(0, 7); // YYYY-MM
        const matchDate = saleMonth === selectedDate;
        const matchPerson = selectedSalesperson ? sale.salespersonId === selectedSalesperson : true;
        return matchDate && matchPerson;
    });

    if (loading) return <div>Carregando vendas...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Histórico de Vendas</h2>
                <Link href="/sales/new" className="btn btn-primary">
                    Nova Venda
                </Link>
            </div>

            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Período:</label>
                    <input
                        type="month"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className={styles.input}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>Vendedor:</label>
                    <select
                        value={selectedSalesperson}
                        onChange={(e) => setSelectedSalesperson(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Todos</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Vendedor</th>
                            <th>Produto</th>
                            <th>Pagamento</th>
                            <th>Valor</th>
                            <th>Parcelas</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map((sale) => (
                            <tr key={sale.id}>
                                <td>{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                                <td>{sale.clientType === 'adult' ? sale.responsibleName : `${sale.studentName} (${sale.responsibleName})`}</td>
                                <td>{sale.salesperson?.name || 'N/A'}</td>
                                <td>{sale.product?.name || 'N/A'}</td>
                                <td>
                                    {sale.paymentMethod === 'credit' && 'Crédito'}
                                    {sale.paymentMethod === 'debit' && 'Débito'}
                                    {sale.paymentMethod === 'pix' && 'PIX'}
                                    {sale.paymentMethod === 'boleto' && 'Boleto'}
                                    {sale.paymentMethod === 'cash' && 'Dinheiro'}
                                    {sale.paymentMethod === 'check' && 'Cheque'}
                                    {!sale.paymentMethod && '-'}
                                </td>
                                <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}</td>
                                <td>{sale.installments?.length || 0}x</td>
                                <td>
                                    <span className={`${styles.status} ${styles[sale.status.toLowerCase()]}`}>
                                        {sale.status === 'Completed' ? 'Concluída' : 'Pendente'}
                                    </span>
                                </td>
                                <td className={styles.actionsCell}>
                                    <Link href={`/sales/${sale.id}`} className={styles.actionButton}>
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(sale)}
                                        className={styles.deleteButton}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredSales.length === 0 && <p className={styles.empty}>Nenhuma venda encontrada neste período.</p>}
        </div>
    );
}

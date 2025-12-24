'use client';

import { Sale, Installment } from '@/types';
import styles from './CommissionTable.module.css';
import { useState } from 'react';

interface CommissionTableProps {
    sales: Sale[];
    filterDate: Date;
    filters: {
        salespersonId: string;
        productId: string;
        campaign: string;
    };
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onStatusChange?: () => void; // Callback to refresh data
}

export default function CommissionTable({ sales, filterDate, filters, selectedIds, onSelectionChange, onStatusChange }: CommissionTableProps) {
    const month = filterDate.getMonth();
    const year = filterDate.getFullYear();

    const filteredInstallments = sales.flatMap(sale =>
        sale.installments.map(inst => ({ ...inst, sale }))
    ).filter(item => {
        const d = new Date(item.dueDate);
        const matchDate = d.getMonth() === month && d.getFullYear() === year;
        const matchSalesperson = filters.salespersonId ? item.sale.salespersonId === filters.salespersonId : true;
        const matchProduct = filters.productId ? item.sale.productId === filters.productId : true;
        const matchCampaign = filters.campaign ? item.sale.campaign === filters.campaign : true;
        return matchDate && matchSalesperson && matchProduct && matchCampaign;
    });

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange(filteredInstallments.map(i => i.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(i => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const toggleStatus = async (id: string, type: 'client' | 'seller', currentValue: boolean) => {
        if (currentValue && !confirm(`Deseja desfazer o pagamento do ${type === 'client' ? 'Cliente' : 'Vendedor'}?`)) return;

        try {
            await fetch('/api/commissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    [type === 'client' ? 'clientPaid' : 'sellerPaid']: !currentValue
                }),
            });
            if (onStatusChange) onStatusChange();
        } catch (error) {
            console.error('Error updating status', error);
            alert('Erro ao atualizar status');
        }
    };

    return (
        <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>
                            <input
                                type="checkbox"
                                checked={filteredInstallments.length > 0 && selectedIds.length === filteredInstallments.length}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th>Vencimento</th>
                        <th>Cliente</th>
                        <th>Vendedor</th>
                        <th>Produto</th>
                        <th>Parc.</th>
                        <th>Valor</th>
                        <th>Comissão</th>
                        <th>Status Pag.</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInstallments.map((item) => {
                        const clientName = item.sale.clientType === 'adult' ? item.sale.responsibleName : `${item.sale.studentName} (${item.sale.responsibleName})`;
                        return (
                            <tr key={item.id} className={selectedIds.includes(item.id) ? styles.selected : ''}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => handleSelectOne(item.id)}
                                    />
                                </td>
                                <td>{new Date(item.dueDate).toLocaleDateString('pt-BR')}</td>
                                <td>{clientName}</td>
                                <td>{item.sale.salesperson?.name || 'N/A'}</td>
                                <td>{item.sale.product?.name || 'N/A'}</td>
                                <td>{item.installmentNumber}/{item.totalInstallments}</td>
                                <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}</td>
                                <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.commissionAmount)}</td>
                                <td>
                                    <div className={styles.statusBadges}>
                                        <span
                                            className={`${styles.badge} ${item.clientPaid ? styles.paid : styles.pending} ${styles.clickable}`}
                                            onClick={() => toggleStatus(item.id, 'client', item.clientPaid)}
                                            title={item.clientPaid ? "Clique para desfazer" : "Clique para confirmar"}
                                        >
                                            {item.clientPaid ? 'Cliente: OK' : 'Cliente: Pend.'}
                                        </span>
                                        <span
                                            className={`${styles.badge} ${item.sellerPaid ? styles.paid : styles.pending} ${styles.clickable}`}
                                            onClick={() => toggleStatus(item.id, 'seller', item.sellerPaid)}
                                            title={item.sellerPaid ? "Clique para desfazer" : "Clique para confirmar"}
                                        >
                                            {item.sellerPaid ? 'Vend.: OK' : 'Vend.: Pend.'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    {/* Individual actions if needed */}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

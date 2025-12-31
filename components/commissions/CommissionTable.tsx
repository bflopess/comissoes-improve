'use client';

import { Sale, Installment } from '@/types';
import styles from './CommissionTable.module.css';
import { useState } from 'react';

interface ExtendedInstallment extends Installment {
    sale: Sale;
}

interface CommissionTableProps {
    installments: ExtendedInstallment[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onStatusChange?: () => void; // Callback to refresh data
}

export default function CommissionTable({ installments, selectedIds, onSelectionChange, onStatusChange }: CommissionTableProps) {

    // Internal filtering removed. We trust the parent to pass filtered data.
    const filteredInstallments = installments; // Alias for compatibility with existing render logic below

    // Sort by due date (oldest first for overdue visibility) - Optional, but good to keep if parent doesn't sort
    // filteredInstallments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Parent should do this


    const handleRenegotiate = async (id: string) => {
        const newDate = prompt("Digite a nova data de vencimento (AAAA-MM-DD):");
        if (!newDate) return;

        try {
            const res = await fetch('/api/installments/renegotiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, newDate }),
            });

            if (!res.ok) throw new Error("Failed");

            alert("Renegociação realizada com sucesso!");
            if (onStatusChange) onStatusChange();
        } catch (error) {
            console.error('Error renegotiating', error);
            alert('Erro ao renegociar parecela');
        }
    };

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
                        <th>Pagamento</th>
                        <th>Resp. Fin.</th>
                        <th>Aluno</th>
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
                        // Logic Update: Paid items are NEVER Overdue visually
                        const isOverdue = item.status === 'Overdue' && !item.clientPaid;
                        const isRenegotiated = item.status === 'Renegotiated';
                        const rowClass = isOverdue ? 'overdue' : isRenegotiated ? 'renegotiated' : '';

                        const paymentMethodMap: Record<string, string> = {
                            'credit': 'Crédito', 'debit': 'Débito', 'pix': 'Pix', 'boleto': 'Boleto', 'cash': 'Dinheiro', 'check': 'Cheque'
                        };

                        return (
                            <tr key={item.id} className={`${selectedIds.includes(item.id) ? styles.selected : ''} ${rowClass}`}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => handleSelectOne(item.id)}
                                    />
                                </td>
                                <td>{new Date(item.dueDate).toLocaleDateString('pt-BR')}</td>
                                <td>{paymentMethodMap[item.sale.paymentMethod || ''] || item.sale.paymentMethod || '-'}</td>
                                <td>{item.sale.responsibleName}</td>
                                <td>{item.sale.studentName || '-'}</td>
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
                                    <div className={styles.actions}>
                                        {item.status === 'Overdue' && !item.clientPaid && (
                                            <button
                                                className={`${styles.btnAction} ${styles.btnRenegotiate}`}
                                                onClick={() => handleRenegotiate(item.id)}
                                            >
                                                Renegociar
                                            </button>
                                        )}
                                        {item.status === 'Renegotiated' && (
                                            <span className={styles.renegotiatedBadge}>Renegociada</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <style jsx>{`
                .overdue { background-color: #fee2e2; }
                .renegotiated { background-color: #f3f4f6; color: #9ca3af; }
            `}</style>
        </div>
    );
}

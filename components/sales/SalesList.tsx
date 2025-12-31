'use client';

import { useState, useEffect } from 'react';
import { Sale } from '@/types';
import styles from './SalesList.module.css';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SalesList() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [users, setUsers] = useState<any[]>([]);
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

    const getPaymentMethodLabel = (method: string) => {
        const map: Record<string, string> = {
            'credit': 'Crédito', 'debit': 'Débito', 'pix': 'Pix', 'boleto': 'Boleto', 'cash': 'Dinheiro', 'check': 'Cheque'
        };
        return map[method] || method || '-';
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const autoTableModule = await import('jspdf-autotable');
        const autoTable = autoTableModule.default;

        doc.setFontSize(18);
        doc.text('Relatório de Vendas', 14, 22);

        doc.setFontSize(11);
        doc.text(`Período: ${selectedDate}`, 14, 30);

        let filterText = '';
        if (selectedSalesperson) {
            const sp = users.find(u => u.id === selectedSalesperson);
            filterText += `Vendedor: ${sp?.name || selectedSalesperson}`;
            doc.text(filterText, 14, 36);
        }

        const tableData = filteredSales.map(sale => [
            new Date(sale.date).toLocaleDateString('pt-BR'),
            sale.clientType === 'adult' ? sale.responsibleName : `${sale.responsibleName} (Resp)`,
            sale.studentName || '-',
            sale.product?.name || 'N/A',
            getPaymentMethodLabel(sale.paymentMethod || ''),
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount),
            `${sale.installments?.length || 0}x`,
            sale.salesperson?.name || 'N/A',
            sale.status === 'Completed' ? 'Concluída' : 'Pendente'
        ]);

        autoTable(doc, {
            head: [['Data', 'Resp. Fin.', 'Aluno', 'Produto', 'Pagamento', 'Valor', 'Parc.', 'Vendedor', 'Status']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 8 },
        });

        doc.save('relatorio-vendas.pdf');
    };

    const handleExportExcel = () => {
        const data = filteredSales.map(sale => ({
            'Data Venda': new Date(sale.date).toLocaleDateString('pt-BR'),
            'Resp. Financeiro': sale.responsibleName,
            'Aluno': sale.studentName || '-',
            'Produto': sale.product?.name || 'N/A',
            'Pagamento': getPaymentMethodLabel(sale.paymentMethod || ''),
            'Valor Total': sale.amount,
            'Parcelas': sale.installments?.length || 0,
            'Vendedor': sale.salesperson?.name || 'N/A',
            'Status': sale.status === 'Completed' ? 'Concluída' : 'Pendente'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Vendas");
        XLSX.writeFile(wb, "relatorio-vendas.xlsx");
    };

    if (loading) return <div>Carregando vendas...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <h2>Histórico de Vendas</h2>
                    <div className={styles.exportActions}>
                        <button onClick={handleExportPDF} className="btn-secondary btn-sm">PDF</button>
                        <button onClick={handleExportExcel} className="btn-secondary btn-sm">Excel</button>
                    </div>
                </div>
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
                                    {getPaymentMethodLabel(sale.paymentMethod || '')}
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

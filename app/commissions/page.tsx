'use client';

import { useState, useEffect } from 'react';
import { Sale, User } from '@/types';
import CommissionTable from '@/components/commissions/CommissionTable';
import styles from './page.module.css';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function CommissionsPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filters, setFilters] = useState({
        salespersonId: '',
        productId: '',
        campaign: '',
        status: '', // 'overdue', 'paid_client', 'paid_seller', 'pending', 'renegotiated'
        paymentMethod: '',
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = () => {
        setLoading(true);
        Promise.all([
            fetch('/api/sales').then(res => res.json()),
            fetch('/api/users').then(res => res.json())
        ]).then(([salesData, usersData]) => {
            setSales(salesData);
            setUsers(usersData.filter((u: User) => u.role === 'salesperson'));
            setLoading(false);
        }).catch(err => {
            console.error('Error fetching data', err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleMassUpdate = async (type: 'client' | 'seller') => {
        if (!confirm(`Confirmar pagamento do ${type === 'client' ? 'Cliente' : 'Vendedor'} para ${selectedIds.length} parcelas?`)) return;

        try {
            await Promise.all(selectedIds.map(id =>
                fetch('/api/commissions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id,
                        [type === 'client' ? 'clientPaid' : 'sellerPaid']: true
                    }),
                })
            ));

            fetchSales();
            setSelectedIds([]);
            alert('Atualização realizada com sucesso!');
        } catch (error) {
            console.error('Error mass updating', error);
            alert('Erro ao atualizar parcelas');
        }
    };

    const getFilteredData = () => {
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();

        return sales.flatMap(sale =>
            sale.installments.map(inst => ({ ...inst, sale }))
        ).filter(item => {
            const d = new Date(item.dueDate);
            const matchMonth = d.getMonth() === month && d.getFullYear() === year;
            // Strict logic: If client paid, it is NOT overdue visually
            const isOverdue = item.status === 'Overdue' && !item.clientPaid;

            // Core Date Logic: 
            // Show items due in selected month OR global overdue (unpaid) items.
            // Requirement: "Visão mensal". 
            // If user filters by 'overdue', show ALL overdue regardless of month.
            // If user filters by basic month view, show month items + historical overdue.

            let matchDate = matchMonth || isOverdue;

            // Apply Filters
            const matchSalesperson = filters.salespersonId ? item.sale.salespersonId === filters.salespersonId : true;
            const matchPaymentMethod = filters.paymentMethod ? item.sale.paymentMethod === filters.paymentMethod : true;

            let matchStatus = true;
            if (filters.status) {
                if (filters.status === 'overdue') matchStatus = isOverdue;
                if (filters.status === 'paid_client') matchStatus = item.clientPaid;
                if (filters.status === 'paid_seller') matchStatus = item.sellerPaid;
                if (filters.status === 'pending') matchStatus = !item.clientPaid && !isOverdue && item.status !== 'Renegotiated';
                if (filters.status === 'renegotiated') matchStatus = item.status === 'Renegotiated';

                // If filtering by status, we might want to ignore the date constraint if it hides relevant data?
                // Example: 'Show all Paid Client commissions'. If we enforce 'matchDate', we only see paid ones due this month/overdue.
                // Usually filters refine the current view. Let's keep `matchDate` as a base constraint unless checking History?
                // For now, adhering to "Month View" approach.
            }

            return matchDate && matchSalesperson && matchPaymentMethod && matchStatus;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF('l', 'mm', 'a4');

        const autoTableModule = await import('jspdf-autotable');
        const autoTable = autoTableModule.default;

        doc.setFontSize(18);
        doc.text('Relatório de Comissões', 14, 22);

        doc.setFontSize(11);
        doc.text(`Mês Referência: ${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, 14, 30);

        let filterText = 'Filtros: ';
        if (filters.salespersonId) {
            const sp = users.find(u => u.id === filters.salespersonId);
            filterText += `Vend: ${sp?.name || filters.salespersonId} `;
        }
        if (filters.status) filterText += `Status: ${filters.status} `;
        if (filters.paymentMethod) filterText += `Pag: ${filters.paymentMethod} `;
        doc.setFontSize(10);
        doc.text(filterText, 14, 36);

        const filteredData = getFilteredData().filter(item => item.status !== 'Renegotiated');

        const paymentMethodMap: Record<string, string> = {
            'credit': 'Crédito', 'debit': 'Débito', 'pix': 'Pix', 'boleto': 'Boleto', 'cash': 'Dinheiro', 'check': 'Cheque'
        };

        const tableData = filteredData.map(inst => [
            new Date(inst.dueDate).toLocaleDateString('pt-BR'),
            paymentMethodMap[inst.sale.paymentMethod || ''] || inst.sale.paymentMethod || '-',
            inst.sale.clientType === 'adult' ? inst.sale.responsibleName : `${inst.sale.studentName} (${inst.sale.responsibleName})`,
            inst.sale.salesperson?.name || 'N/A', // Using loaded users if needed, but sale has snapshots usually or we rely on join. route.ts joins users!
            `${inst.installmentNumber}/${inst.totalInstallments}`,
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount),
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.commissionAmount),
            inst.status === 'Overdue' && !inst.clientPaid ? 'ATRASADO' : (inst.clientPaid ? 'PAGO' : 'PENDENTE'),
            inst.clientPaid ? 'Sim' : 'Não',
            inst.sellerPaid ? 'Sim' : 'Não'
        ]);

        autoTable(doc, {
            head: [['Vencimento', 'Pagamento', 'Cliente', 'Vendedor', 'Parc.', 'Valor', 'Comissão', 'Status', 'Cli.', 'Vend.']],
            body: tableData,
            startY: 40,
            styles: { fontSize: 8 },
            didParseCell: function (data: any) {
                if (data.section === 'body' && data.row.raw[7] === 'ATRASADO') {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        doc.save('relatorio-comissoes.pdf');
    };

    const handleExportExcel = () => {
        const filteredData = getFilteredData().filter(item => item.status !== 'Renegotiated');

        const paymentMethodMap: Record<string, string> = {
            'credit': 'Crédito', 'debit': 'Débito', 'pix': 'Pix', 'boleto': 'Boleto', 'cash': 'Dinheiro', 'check': 'Cheque'
        };

        const data = filteredData.map(inst => ({
            'Vencimento': new Date(inst.dueDate).toLocaleDateString('pt-BR'),
            'Vencimento Original': new Date(inst.dueDate).toISOString().split('T')[0],
            'Forma Pagamento': paymentMethodMap[inst.sale.paymentMethod || ''] || inst.sale.paymentMethod || '-',
            'Cliente': inst.sale.clientType === 'adult' ? inst.sale.responsibleName : `${inst.sale.studentName} (${inst.sale.responsibleName})`,
            'Vendedor': inst.sale.salesperson?.name || 'N/A',
            'Parcela': `${inst.installmentNumber}/${inst.totalInstallments}`,
            'Valor': inst.amount,
            'Comissão': inst.commissionAmount,
            'Status': inst.status === 'Overdue' && !inst.clientPaid ? 'ATRASADO' : (inst.clientPaid ? 'PAGO' : 'PENDENTE'),
            'Pago Cliente': inst.clientPaid ? 'Sim' : 'Não',
            'Pago Vendedor': inst.sellerPaid ? 'Sim' : 'Não',
            'Data Pagamento': inst.paidDate ? new Date(inst.paidDate).toLocaleDateString('pt-BR') : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Comissões");
        XLSX.writeFile(wb, "relatorio-comissoes.xlsx");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Relatório de Comissões</h1>
                <div className={styles.actions}>
                    <button onClick={handleExportPDF} className="btn">Exportar PDF</button>
                    <button onClick={handleExportExcel} className="btn" style={{ marginLeft: '10px', backgroundColor: '#107c41' }}>Exportar Excel</button>
                </div>
            </div>

            <div className={styles.filtersContainer}>
                <div className={styles.filterGroup}>
                    <label>Mês Ref.</label>
                    <input
                        type="month"
                        value={selectedDate.toISOString().slice(0, 7)}
                        onChange={(e) => setSelectedDate(new Date(e.target.value + '-02'))}
                        className={styles.input}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label>Status</label>
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className={styles.select}
                    >
                        <option value="">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="overdue">Atrasados</option>
                        <option value="paid_client">Pago pelo Cliente</option>
                        <option value="paid_seller">Pago ao Vendedor</option>
                        <option value="renegotiated">Renegociados</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Forma Pag.</label>
                    <select
                        name="paymentMethod"
                        value={filters.paymentMethod}
                        onChange={handleFilterChange}
                        className={styles.select}
                    >
                        <option value="">Todas</option>
                        <option value="credit">Cartão de Crédito</option>
                        <option value="debit">Cartão de Débito</option>
                        <option value="pix">PIX</option>
                        <option value="boleto">Boleto</option>
                        <option value="cash">Dinheiro</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Vendedor</label>
                    <select
                        name="salespersonId"
                        value={filters.salespersonId}
                        onChange={handleFilterChange}
                        className={styles.select}
                    >
                        <option value="">Todos os Vendedores</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className={styles.bulkActions}>
                    <span>{selectedIds.length} selecionados</span>
                    <button onClick={() => handleMassUpdate('client')} className="btn btn-sm">Confirmar Cliente</button>
                    <button onClick={() => handleMassUpdate('seller')} className="btn btn-sm">Confirmar Vendedor</button>
                </div>
            )}

            {loading ? (
                <div>Carregando...</div>
            ) : (
                <CommissionTable
                    installments={getFilteredData()}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onStatusChange={fetchSales}
                />
            )}
        </div>
    );
}

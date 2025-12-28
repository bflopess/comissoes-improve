'use client';

import { useState, useEffect } from 'react';
import { Sale } from '@/types';
import CommissionTable from '@/components/commissions/CommissionTable';
import styles from './page.module.css';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function CommissionsPage() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filters, setFilters] = useState({
        salespersonId: '',
        productId: '',
        campaign: '',
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = () => {
        setLoading(true);
        fetch('/api/sales')
            .then(res => res.json())
            .then(data => {
                setSales(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching sales', err);
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
            const isOverdue = item.status === 'Overdue';
            const matchDate = matchMonth || isOverdue;

            const matchSalesperson = filters.salespersonId ? item.sale.salespersonId === filters.salespersonId : true;
            const matchProduct = filters.productId ? item.sale.productId === filters.productId : true;
            const matchCampaign = filters.campaign ? item.sale.campaign === filters.campaign : true;
            return matchDate && matchSalesperson && matchProduct && matchCampaign;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF();

        // Dynamically import autoTable
        const autoTableModule = await import('jspdf-autotable');
        const autoTable = autoTableModule.default;

        // Header
        doc.setFontSize(18);
        doc.text('Relatório de Comissões', 14, 22);

        doc.setFontSize(11);
        doc.text(`Mês Referência: ${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, 14, 30);

        // Filter Info
        let filterText = 'Filtros: ';
        if (filters.salespersonId) filterText += `Vendedor ID: ${filters.salespersonId} `;
        if (filters.productId) filterText += `Produto ID: ${filters.productId} `;
        if (filters.campaign) filterText += `Campanha: ${filters.campaign} `;
        if (filterText === 'Filtros: ') filterText += 'Nenhum';

        doc.setFontSize(10);
        doc.text(filterText, 14, 36);

        // Table Data
        const filteredData = getFilteredData().filter(item => item.status !== 'Renegotiated');

        const tableData = filteredData.map(inst => [
            new Date(inst.dueDate).toLocaleDateString('pt-BR'),
            inst.sale.clientType === 'adult' ? inst.sale.responsibleName : `${inst.sale.studentName} (${inst.sale.responsibleName})`,
            inst.sale.salesperson?.name || 'N/A',
            inst.sale.product?.name || 'N/A',
            `${inst.installmentNumber}/${inst.totalInstallments}`,
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount),
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.commissionAmount),
            inst.status || 'Pending',
            inst.clientPaid ? 'Sim' : 'Não',
            inst.sellerPaid ? 'Sim' : 'Não'
        ]);

        // Use autoTable via the imported module
        autoTable(doc, {
            head: [['Vencimento', 'Cliente', 'Vendedor', 'Produto', 'Parc.', 'Valor', 'Comissão', 'Status', 'Pago (Cli)', 'Pago (Vend)']],
            body: tableData,
            startY: 40,
            didParseCell: function (data: any) {
                if (data.section === 'body' && data.row.raw[7] === 'Overdue') {
                    data.cell.styles.textColor = [220, 38, 38]; // Red
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        doc.save('relatorio-comissoes.pdf');
    };

    const handleExportExcel = () => {
        const filteredData = getFilteredData().filter(item => item.status !== 'Renegotiated');
        const data = filteredData.map(inst => ({
            'Vencimento': new Date(inst.dueDate).toLocaleDateString('pt-BR'),
            'Vencimento Original': new Date(inst.dueDate).toISOString().split('T')[0],
            'Cliente': inst.sale.clientType === 'adult' ? inst.sale.responsibleName : `${inst.sale.studentName} (${inst.sale.responsibleName})`,
            'Vendedor': inst.sale.salesperson?.name || 'N/A',
            'Produto': inst.sale.product?.name || 'N/A',
            'Parcela': `${inst.installmentNumber}/${inst.totalInstallments}`,
            'Valor': inst.amount,
            'Comissão': inst.commissionAmount,
            'Status': inst.status || 'Pending',
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

            <div className={styles.filters}>
                <input
                    type="month"
                    value={selectedDate.toISOString().slice(0, 7)}
                    onChange={(e) => setSelectedDate(new Date(e.target.value + '-02'))} // Avoid timezone issues
                    className={styles.input}
                />
                {/* Add other filters UI here if needed */}
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
                    sales={sales}
                    filterDate={selectedDate}
                    filters={filters}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onStatusChange={fetchSales}
                />
            )}
        </div>
    );
}

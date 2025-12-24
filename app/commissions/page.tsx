'use client';

import { useState, useEffect } from 'react';
import { Sale } from '@/types';
import CommissionTable from '@/components/commissions/CommissionTable';
import styles from './page.module.css';
import jsPDF from 'jspdf';

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

    const handleExportPDF = async () => {
        const doc = new jsPDF();

        // Dynamically import autoTable
        const autoTableModule = await import('jspdf-autotable');
        const autoTable = autoTableModule.default;

        // Header
        doc.setFontSize(18);
        doc.text('Relatório de Comissões', 14, 22);

        doc.setFontSize(11);
        doc.text(`Mês: ${selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`, 14, 30);

        // Filter Info
        let filterText = 'Filtros: ';
        if (filters.salespersonId) filterText += `Vendedor ID: ${filters.salespersonId} `;
        if (filters.productId) filterText += `Produto ID: ${filters.productId} `;
        if (filters.campaign) filterText += `Campanha: ${filters.campaign} `;
        if (filterText === 'Filtros: ') filterText += 'Nenhum';

        doc.setFontSize(10);
        doc.text(filterText, 14, 36);

        // Table Data
        const month = selectedDate.getMonth();
        const year = selectedDate.getFullYear();

        const tableData = sales.flatMap(sale =>
            sale.installments
                .filter(inst => {
                    const d = new Date(inst.dueDate);
                    return d.getMonth() === month && d.getFullYear() === year;
                })
                .map(inst => [
                    new Date(inst.dueDate).toLocaleDateString('pt-BR'),
                    sale.clientType === 'adult' ? sale.responsibleName : `${sale.studentName} (${sale.responsibleName})`,
                    sale.salesperson?.name || 'N/A',
                    sale.product?.name || 'N/A',
                    `${inst.installmentNumber}/${inst.totalInstallments}`,
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.amount),
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(inst.commissionAmount),
                    inst.clientPaid ? 'Sim' : 'Não',
                    inst.sellerPaid ? 'Sim' : 'Não'
                ])
        );

        // Use autoTable via the imported module
        autoTable(doc, {
            head: [['Vencimento', 'Cliente', 'Vendedor', 'Produto', 'Parc.', 'Valor', 'Comissão', 'Pago (Cli)', 'Pago (Vend)']],
            body: tableData,
            startY: 40,
        });

        doc.save('relatorio-comissoes.pdf');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Relatório de Comissões</h1>
                <div className={styles.actions}>
                    <button onClick={handleExportPDF} className="btn">Exportar PDF</button>
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

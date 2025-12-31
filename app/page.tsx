'use client';

import { useState, useEffect, useMemo } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import CommissionCharts from '@/components/commissions/CommissionCharts';
import styles from './page.module.css';
import { Sale } from '@/types';

export default function Dashboard() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetch('/api/sales')
      .then(res => res.json())
      .then(data => {
        setSales(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch sales', err);
        setLoading(false);
      });
  }, []);

  const summary = useMemo(() => {
    const month = selectedDate.getMonth();
    const year = selectedDate.getFullYear();

    // Global Overdue (Critical Alert) - Must respect "Not Paid" rule
    const globalOverdueCount = sales.flatMap(s => s.installments)
      .filter(inst => inst.status === 'Overdue' && !inst.clientPaid).length;

    // Filter installments for the selected month, enriching with Sale data
    const monthlyInstallments = sales.flatMap(s => s.installments.map(inst => ({ ...inst, sale: s })))
      .filter(inst => {
        const d = new Date(inst.dueDate);
        return d.getMonth() === month && d.getFullYear() === year;
      });

    // Unique sales with installments this month? 
    // We can use the enriched "sale" property to get IDs.
    const totalSales = new Set(monthlyInstallments.map(i => i.saleId)).size;
    // Usually "Sales" means new contracts signed. But "Commissions" dashboard usually focuses on cash flow.
    // Let's stick to Commission Cash Flow for "Total Commission" stats.

    // Sum commissions due in this month
    const totalCommission = monthlyInstallments.reduce((acc, inst) => acc + inst.commissionAmount, 0);
    const paidCommission = monthlyInstallments.filter(inst => inst.sellerPaid).reduce((acc, inst) => acc + inst.commissionAmount, 0);
    const pendingCommission = totalCommission - paidCommission;

    // Monthly Delinquency (items due this month that are overdue or unpaid and past due?)
    // Actually, simple "Overdue" status is set by job. 
    // "Inadimplência real por mês": existing overdue items that were due in this month.
    const monthlyOverdueCount = monthlyInstallments.filter(inst => inst.status === 'Overdue' && !inst.clientPaid).length;

    // Salesperson Stats for this month
    const salespersonStats: Record<string, number> = {};
    monthlyInstallments.forEach(inst => {
      // Now inst.sale exists!
      const name = inst.sale.salespersonName || 'Desconhecido';
      salespersonStats[name] = (salespersonStats[name] || 0) + inst.commissionAmount;
    });

    return {
      globalOverdueCount,
      monthlyOverdueCount,
      totalSales,
      totalCommission,
      paidCommission,
      pendingCommission,
      salespersonStats
    };
  }, [sales, selectedDate]);

  if (loading) return <div className={styles.loading}>Carregando dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Painel Geral</h1>
        <input
          type="month"
          value={selectedDate.toISOString().slice(0, 7)}
          onChange={(e) => setSelectedDate(new Date(e.target.value + '-02'))}
          className={styles.monthPicker}
        />
      </div>

      {summary.globalOverdueCount > 0 && (
        <a href="/app/commissions?status=overdue" style={{ textDecoration: 'none' }}>
          <div className={styles.alertCard} style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#b91c1c',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <strong>{summary.globalOverdueCount} comissões em atraso (Geral).</strong> Clique para resolver.
          </div>
        </a>
      )}

      <div className={styles.statsGrid}>
        <StatsCard
          title="Vendas Ativas (Mês)"
          value={summary.totalSales.toString()}
        />
        <StatsCard
          title="Comissão Prevista"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalCommission)}
        />
        <StatsCard
          title="Comissão Paga"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.paidCommission)}
          trendDirection="up"
        />
        <StatsCard
          title="Comissão Pendente"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.pendingCommission)}
          trendDirection="neutral"
        />
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.row}>
          <div className={styles.col}>
            <h2>Top Vendedores ({selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})</h2>
            <ul className={styles.salespersonList}>
              {Object.entries(summary.salespersonStats)
                .sort(([, a], [, b]) => b - a)
                .map(([name, val]) => (
                  <li key={name} className={styles.salespersonItem}>
                    <span>{name}</span>
                    <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)}</strong>
                  </li>
                ))}
              {Object.keys(summary.salespersonStats).length === 0 && <li className={styles.emptyMsg}>Nenhuma comissão este mês.</li>}
            </ul>
          </div>
          <div className={styles.col}>
            <h2>Análise</h2>
            <CommissionCharts sales={sales} filterDate={selectedDate} />
          </div>
        </div>
      </div>

      {/* Inline styles for quick addition, move to CSS module in refinement if needed */}
      <style jsx>{`
        .salespersonList { list-style: none; padding: 0; }
        .salespersonItem { display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid #eee; }
        .salespersonItem:last-child { border-bottom: none; }
        .emptyMsg { color: #888; padding: 1rem; font-style: italic; }
      `}</style>
    </div>
  );
}

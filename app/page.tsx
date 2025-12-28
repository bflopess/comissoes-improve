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
    const totalSales = sales.length;
    const totalCommission = sales.flatMap(s => s.installments).reduce((acc, inst) => acc + inst.commissionAmount, 0);
    const paidCommission = sales.flatMap(s => s.installments).filter(inst => inst.sellerPaid).reduce((acc, inst) => acc + inst.commissionAmount, 0);
    const pendingCommission = totalCommission - paidCommission;

    // Count Overdue
    const overdueCount = sales.flatMap(s => s.installments).filter(inst => inst.status === 'Overdue').length;

    return { totalSales, totalCommission, paidCommission, pendingCommission, overdueCount };
  }, [sales]);

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Painel Geral</h1>

      {summary.overdueCount > 0 && (
        <a href="/app/commissions" style={{ textDecoration: 'none' }}>
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
            <strong>{summary.overdueCount} comissões em atraso.</strong> Clique para ver detalhes.
          </div>
        </a>
      )}

      <div className={styles.statsGrid}>
        <StatsCard
          title="Total de Vendas"
          value={summary.totalSales.toString()}
        />
        <StatsCard
          title="Comissão Total"
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
        <h2>Análise de Comissões</h2>
        <CommissionCharts sales={sales} filterDate={selectedDate} />
      </div>
    </div>
  );
}

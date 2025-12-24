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

    return { totalSales, totalCommission, paidCommission, pendingCommission };
  }, [sales]);

  if (loading) return <div>Carregando dashboard...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Painel Geral</h1>

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

'use client';

import { Sale } from '@/types';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import styles from './CommissionCharts.module.css';

interface CommissionChartsProps {
    sales: Sale[];
    filterDate: Date;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CommissionCharts({ sales, filterDate }: CommissionChartsProps) {
    const month = filterDate.getMonth();
    const year = filterDate.getFullYear();

    const currentMonthInstallments = useMemo(() => {
        return sales.flatMap(s => s.installments).filter(inst => {
            const d = new Date(inst.dueDate);
            return d.getMonth() === month && d.getFullYear() === year;
        });
    }, [sales, month, year]);

    // Data for Bar Chart: Commission by Salesperson
    const salespersonData = useMemo(() => {
        const data: Record<string, number> = {};
        currentMonthInstallments.forEach(inst => {
            const sale = sales.find(s => s.id === inst.saleId);
            if (sale && sale.salesperson) {
                data[sale.salesperson.name] = (data[sale.salesperson.name] || 0) + inst.commissionAmount;
            }
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [currentMonthInstallments, sales]);

    // Data for Pie Chart: Commission by Product
    const productData = useMemo(() => {
        const data: Record<string, number> = {};
        currentMonthInstallments.forEach(inst => {
            const sale = sales.find(s => s.id === inst.saleId);
            if (sale && sale.product) {
                data[sale.product.name] = (data[sale.product.name] || 0) + inst.commissionAmount;
            }
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [currentMonthInstallments, sales]);

    // Data for Line Chart: Evolution (Last 6 months)
    const evolutionData = useMemo(() => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(filterDate);
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth();
            const y = d.getFullYear();

            const total = sales.flatMap(s => s.installments).filter(inst => {
                const id = new Date(inst.dueDate);
                return id.getMonth() === m && id.getFullYear() === y;
            }).reduce((acc, inst) => acc + inst.commissionAmount, 0);

            data.push({
                name: d.toLocaleDateString('pt-BR', { month: 'short' }),
                total
            });
        }
        return data;
    }, [sales, filterDate]);

    // Data for Pie Chart: Sales by Payment Method (Monthly)
    const paymentMethodData = useMemo(() => {
        const data: Record<string, number> = {};
        sales.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === month && d.getFullYear() === year;
        }).forEach(s => {
            const method = s.paymentMethod || 'Outros';
            data[method] = (data[method] || 0) + 1;
        });
        const labels: Record<string, string> = {
            credit: 'Crédito', debit: 'Débito', pix: 'PIX', boleto: 'Boleto', cash: 'Dinheiro', check: 'Cheque', 'Outros': 'N/D'
        };
        return Object.entries(data).map(([key, value]) => ({ name: labels[key] || key, value }));
    }, [sales, month, year]);

    // Data for Bar Chart: Ticket Average (Monthly)
    const ticketAvgData = useMemo(() => {
        const data: Record<string, { total: number, count: number }> = {};
        sales.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === month && d.getFullYear() === year;
        }).forEach(s => {
            const name = s.salespersonName || 'N/A';
            if (!data[name]) data[name] = { total: 0, count: 0 };
            data[name].total += s.amount;
            data[name].count += 1;
        });
        return Object.entries(data).map(([name, { total, count }]) => ({ name, value: total / count }));
    }, [sales, month, year]);

    // Data for Pie Chart: Paid vs Pending (All time or Monthly? Prompt says "Percentual de Comissão Paga vs Pendente" usually generic status. Let's do Monthly to match context)
    const commissionStatusData = useMemo(() => {
        let paid = 0;
        let pending = 0;
        currentMonthInstallments.forEach(inst => {
            if (inst.sellerPaid) paid += inst.commissionAmount;
            else pending += inst.commissionAmount;
        });
        return [
            { name: 'Paga', value: paid },
            { name: 'Pendente', value: pending }
        ];
    }, [currentMonthInstallments]);

    // Top 5 Products (Monthly by Amount)
    const topProductsData = useMemo(() => {
        const data: Record<string, number> = {};
        sales.filter(s => {
            const d = new Date(s.date);
            return d.getMonth() === month && d.getFullYear() === year;
        }).forEach(s => {
            const name = s.productName || 'N/A';
            data[name] = (data[name] || 0) + s.amount;
        });
        return Object.entries(data)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [sales, month, year]);

    return (
        <div className={styles.chartsGrid}>
            <div className={styles.chartCard}>
                <h3>Comissão por Vendedor</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salespersonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
                        <Bar dataKey="value" fill="#8884d8" name="Comissão" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
                <h3>Ticket Médio por Vendedor</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ticketAvgData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
                        <Bar dataKey="value" fill="#82ca9d" name="Ticket Médio" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
                <h3>Comissão: Paga vs Pendente</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={commissionStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            <Cell fill="#00C49F" />
                            <Cell fill="#FFBB28" />
                        </Pie>
                        <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
                <h3>Formas de Pagamento</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={paymentMethodData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            dataKey="value"
                        >
                            {paymentMethodData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
                <h3>Top 5 Produtos (Receita)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProductsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
                        <Bar dataKey="value" fill="#FF8042" name="Vendas" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
                <h3>Evolução Mensal (Comissões)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
                        <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

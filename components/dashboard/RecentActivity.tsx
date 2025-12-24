import { Sale } from '@/types';
import styles from './RecentActivity.module.css';

interface RecentActivityProps {
    recentSales: Sale[];
}

export default function RecentActivity({ recentSales }: RecentActivityProps) {
    return (
        <div className={styles.container}>
            <h3 className={styles.heading}>Vendas Recentes</h3>
            <div className={styles.list}>
                {recentSales.length === 0 ? (
                    <p className={styles.empty}>Nenhuma atividade recente.</p>
                ) : (
                    recentSales.map((sale) => (
                        <div key={sale.id} className={styles.item}>
                            <div className={styles.info}>
                                <p className={styles.customer}>{sale.responsibleName}</p>
                                <p className={styles.product}>{sale.productName}</p>
                            </div>
                            <div className={styles.meta}>
                                <p className={styles.amount}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sale.amount)}
                                </p>
                                <p className={styles.date}>{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

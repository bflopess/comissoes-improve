import SalesList from '@/components/sales/SalesList';
import styles from './page.module.css';

export default function SalesPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Gestão de Vendas</h1>
            <SalesList />
        </div>
    );
}

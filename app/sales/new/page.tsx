import SaleForm from '@/components/sales/SaleForm';
import styles from './page.module.css';

export default function NewSalePage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Nova Venda</h1>
            <SaleForm />
        </div>
    );
}

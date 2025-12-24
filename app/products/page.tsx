import ProductList from '@/components/products/ProductList';
import styles from './page.module.css';

export default function ProductsPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Gestão de Produtos</h1>
            <ProductList />
        </div>
    );
}

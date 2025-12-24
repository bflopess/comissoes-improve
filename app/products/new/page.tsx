import ProductForm from '@/components/products/ProductForm';
import styles from './page.module.css';

export default function NewProductPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Novo Produto</h1>
            <ProductForm />
        </div>
    );
}

import { login, signup } from './actions'
import styles from './page.module.css'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string; error?: string }>
}) {
    // Await searchParams in Next.js 15+ (if applicable, but safer to treat as promise or regular obj depending on version. 
    // The user's types earlier suggested Next 16.1.0 where params/searchParams are promises).
    // Let's handle it safely.
    const params = await searchParams;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Comissões Improve</h1>
                    <p className={styles.subtitle}>Faça login para continuar</p>
                </div>

                <form className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="password">Senha</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className={styles.input}
                        />
                    </div>

                    {(params?.error || params?.message) && (
                        <div className={styles.errorBox}>
                            {params.error || params.message}
                        </div>
                    )}

                    <div className={styles.buttonGroup}>
                        <button
                            formAction={login}
                            className={`btn ${styles.loginButton}`}
                        >
                            Entrar
                        </button>
                        <button
                            formAction={signup}
                            className={`btn ${styles.signupButton}`}
                        >
                            Criar Conta
                        </button>
                    </div>
                    <div className={styles.footer}>
                        <p>Se você já tem cadastro no sistema, use o botão "Criar Conta" com seu email cadastrado para definir sua senha.</p>
                    </div>
                </form>
            </div>
        </div>
    )
}

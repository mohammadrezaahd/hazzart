import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card" aria-labelledby="admin-login-title">
        <p className="admin-auth-kicker">HAZZART</p>
        <h1 id="admin-login-title">Admin Login</h1>
        <p className="admin-auth-description">
          Sign in to manage the artist portfolio.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}

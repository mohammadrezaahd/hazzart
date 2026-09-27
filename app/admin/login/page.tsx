import Link from "next/link";
import { getApiUrl } from "@/lib/app-config";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <main className="admin-login-page">
      <div className="admin-login-art" aria-hidden="true">
        <div className="admin-login-art__circle" />
        <span>HAZZART</span>
      </div>

      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-brand">
          <Link href="/" className="admin-brand-mark" aria-label="Back to Hazzart website">
            HAZZART
          </Link>
          <span>ADMIN</span>
        </div>

        <div className="admin-login-heading">
          <p className="admin-eyebrow">PRIVATE AREA</p>
          <h1 id="admin-login-title">Welcome back.</h1>
          <p>Sign in to manage the artist portfolio.</p>
        </div>

        <LoginForm apiUrl={getApiUrl()} />

        <Link href="/" className="admin-login-back">
          <span aria-hidden="true">←</span>
          Back to website
        </Link>
      </section>
    </main>
  );
}
